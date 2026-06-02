---
name: geospatial-analysis
description: Use for GIS/geospatial analysis where the coordinate reference system is the first thing to get right — identifying each dataset's CRS/EPSG/datum and units, reprojecting to a fit-for-purpose projected/equal-area CRS before any metric work, confirming layers share a CRS before spatial joins/overlays/buffers, running the right primitive in PostGIS (ST_Transform/ST_DWithin/ST_Intersects/ST_Buffer/ST_Area, GiST index, geography vs geometry) or GeoPandas/Shapely (to_crs/sjoin/buffer/overlay/make_valid), and handling raster resolution/extent/resampling. Catches CRS/datum-mismatch, axis-order, and Web-Mercator-distortion pitfalls. TRIGGER on reprojection, spatial joins, buffers, overlays, distance/area, or vector/raster work. Any GIS agent (geospatial analyst, spatial-data engineer, map-builder) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: domain
tags: [gis, geospatial, postgis, geopandas]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Geospatial Analysis

The substantive capability for correct GIS analysis. The most common way GIS goes wrong is
the coordinate reference system, so this skill checks CRS first and reprojects to a
fit-for-purpose CRS before measuring or joining.

## When to use this skill
When the task is spatial: picking/reprojecting CRSs, spatial joins, buffers, overlays/clips,
distance/area measurement, or working with vector vs raster data in PostGIS,
GeoPandas/Shapely, or QGIS. Establish the **CRS of every dataset** before doing anything
spatial — the EPSG code, the units (degrees vs meters/feet), and the datum (read `.prj`/
`gdalinfo` for rasters, `ST_SRID`/`geometry_columns` in PostGIS, `gdf.crs` in GeoPandas).
Identify whether data is **vector** or **raster** and the **analysis goal** (proximity,
overlay, aggregation, routing, measurement, visualization).

## Instructions
1. **Get the CRS right (the #1 source of bugs).**
   - **EPSG:4326 (WGS84)** is lat/lon in **degrees** — geographic; you cannot measure
     distance/area in meters directly, and 1° is not a constant distance.
   - **EPSG:3857 (Web Mercator)** is for web tiles; it badly distorts area/distance away from
     the equator — never use it for area or accurate distance.
   - For metric measurement, **reproject to an appropriate projected CRS**: a local UTM zone
     (EPSG:326xx/327xx), a national grid (e.g. EPSG:27700 OSGB, EPSG:2154 Lambert-93), or an
     equal-area CRS for area work.
   - **Datum matters:** WGS84 vs NAD83 vs ED50 differ by meters; never assume a transformation
     is identity. Watch axis order (lat/lon vs lon/lat), which bites GeoJSON ↔ some WKT/WMS
     sources.
2. **Confirm all layers share a CRS before any spatial op.** A spatial join/overlay between
   mismatched CRSs silently produces garbage (empty results or wrong matches). Reproject to a
   common, fit-for-purpose CRS first, then operate.
3. **Run the analysis with the right primitive.**
   - **PostGIS:** `ST_Transform(geom, 32633)` to reproject; `ST_DWithin`/`ST_Intersects`/
     `ST_Contains` for predicates (use `ST_DWithin` over `ST_Distance < x` so the spatial
     index is used); `ST_Buffer` (in a projected CRS, in meters); `ST_Intersection`/
     `ST_Union`/`ST_Difference` for overlay; `ST_Area(geom::geography)` or area in a projected
     CRS; `ST_MakeValid` for broken geometries. Ensure a **GiST index** on the geometry column.
     Use `geography` for global great-circle distance; `geometry` in a projected CRS otherwise.
   - **GeoPandas/Shapely:** `gdf.to_crs(32633)`; `gpd.sjoin(left, right, predicate="intersects")`;
     `gdf.buffer(500)` (projected CRS, meters); `overlay(a, b, how="intersection")`;
     `.geometry.is_valid` + `make_valid`/`buffer(0)` to fix invalid polygons. Set `gdf.crs` if a
     file loaded without one; never blindly `set_crs` to "fix" a reprojection (that mislabels,
     it does not transform — use `to_crs`).
   - **Raster:** match resolution/extent/CRS before map algebra; resample/`warp` (gdalwarp) with
     the right resampling (nearest for categorical, bilinear/cubic for continuous); mind nodata.
4. **Verify spatially, not just numerically.** Sanity-check results: counts and totals are
   plausible, geometries are valid, buffers/areas have sensible magnitudes for the CRS units,
   and (when possible) a quick plot/export looks geographically right. Compare against a known
   landmark or expected count.

## Inputs
- The datasets and their CRS metadata, whether vector or raster, and the analysis goal.

## Output
- The CRS of each input and the CRS operated in, with EPSG codes and why.
- The query/code (PostGIS SQL or GeoPandas/Python), with reprojection steps explicit.
- The result plus the spatial sanity-check run (validity, counts, magnitude, units).
- Pitfalls flagged: any CRS/datum mismatch, axis-order issue, or measurement done in a CRS
  unsuited to it.

## Notes
- Never do distance/area work in a geographic (degree) or Web Mercator CRS without flagging
  distortion; reproject first.
- Never assume two layers share a CRS — verify and reproject (`to_crs`/`ST_Transform`), don't
  relabel (`set_crs`/`ST_SetSRID` only fixes a missing/wrong label, not the coordinates).
- State units everywhere (degrees vs meters vs feet); ambiguous units are a defect.
- Scope Bash to local analysis tooling (`gdalinfo`, `gdalwarp`, `ogr2ogr`, `psql` against
  local/dev databases); do not query production spatial databases without explicit instruction.
- Combine with [[verify-by-running]] to actually run the query/code and the sanity-check, and
  [[match-project-conventions]] to match the project's CRS conventions, units, and tooling.
