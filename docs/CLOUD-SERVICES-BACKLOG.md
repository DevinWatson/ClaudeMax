# Cloud Service Specialists Backlog (autonomous loop)

One **thin specialist agent + one backing per-service capability skill** per cloud service,
across AWS → GCP → Azure. Built by the overnight loop in batches (~8 services per wake, one
agent-architect call), then audit → validate → promote to stable → commit → push → check off.

Line format (pipe-delimited, no spaces around pipes):
`- [ ] <platform>|<category-slug>|<service-slug>|<Display Name>`

- Agent: `agents/cloud/<platform>/services/<category-slug>/<platform>-<service-slug>-specialist.md`
  (name `<platform>-<service-slug>-specialist`, category `cloud`).
- Skill: `skills/cloud/<platform>-<service-slug>/SKILL.md` (name `<platform>-<service-slug>`, category `cloud`).
- Agent composes its per-service skill + match-project-conventions + verify-by-running; tools full
  (Read,Write,Edit,Grep,Glob,Bash); model sonnet; INVOKES [[verify-by-running]] in body.
- Description "Use when … (<Platform> <Service>)" with NOT-boundaries vs the platform role team
  (architect/iac-engineer/security-reviewer own cross-cutting design/IaC/security; the specialist
  owns this one service's design/config/ops/APIs), vs the equivalent service on the other clouds,
  and vs sibling service specialists in the same category.

Resume: take the next N unchecked `[ ]` lines, build, then check them off `[x]`.

---

## AWS

### compute
- [x] aws|compute|ec2|Amazon EC2
- [x] aws|compute|lambda|AWS Lambda
- [x] aws|compute|fargate|AWS Fargate
- [x] aws|compute|lightsail|Amazon Lightsail
- [x] aws|compute|elastic-beanstalk|AWS Elastic Beanstalk
- [x] aws|compute|batch|AWS Batch
- [x] aws|compute|app-runner|AWS App Runner
- [x] aws|compute|ec2-auto-scaling|Amazon EC2 Auto Scaling
- [x] aws|compute|ec2-image-builder|EC2 Image Builder
- [x] aws|compute|outposts|AWS Outposts
- [x] aws|compute|wavelength|AWS Wavelength
- [x] aws|compute|nitro-enclaves|AWS Nitro Enclaves

### containers
- [x] aws|containers|ecs|Amazon ECS
- [x] aws|containers|eks|Amazon EKS
- [x] aws|containers|ecr|Amazon ECR

### storage
- [x] aws|storage|s3|Amazon S3
- [ ] aws|storage|ebs|Amazon EBS
- [ ] aws|storage|efs|Amazon EFS
- [ ] aws|storage|fsx|Amazon FSx
- [ ] aws|storage|s3-glacier|Amazon S3 Glacier
- [ ] aws|storage|storage-gateway|AWS Storage Gateway
- [ ] aws|storage|backup|AWS Backup
- [ ] aws|storage|datasync|AWS DataSync
- [ ] aws|storage|snow-family|AWS Snow Family

### databases
- [ ] aws|databases|rds|Amazon RDS
- [ ] aws|databases|aurora|Amazon Aurora
- [ ] aws|databases|dynamodb|Amazon DynamoDB
- [ ] aws|databases|documentdb|Amazon DocumentDB
- [ ] aws|databases|neptune|Amazon Neptune
- [ ] aws|databases|elasticache|Amazon ElastiCache
- [ ] aws|databases|memorydb|Amazon MemoryDB
- [ ] aws|databases|keyspaces|Amazon Keyspaces
- [ ] aws|databases|timestream|Amazon Timestream
- [ ] aws|databases|qldb|Amazon QLDB
- [ ] aws|databases|dax|DynamoDB Accelerator (DAX)

### networking
- [ ] aws|networking|vpc|Amazon VPC
- [ ] aws|networking|cloudfront|Amazon CloudFront
- [ ] aws|networking|route53|Amazon Route 53
- [ ] aws|networking|api-gateway|Amazon API Gateway
- [ ] aws|networking|direct-connect|AWS Direct Connect
- [ ] aws|networking|vpn|AWS VPN
- [ ] aws|networking|transit-gateway|AWS Transit Gateway
- [ ] aws|networking|global-accelerator|AWS Global Accelerator
- [ ] aws|networking|cloud-map|AWS Cloud Map
- [ ] aws|networking|privatelink|AWS PrivateLink
- [ ] aws|networking|elastic-load-balancing|Elastic Load Balancing
- [ ] aws|networking|network-firewall|AWS Network Firewall

### analytics
- [ ] aws|analytics|athena|Amazon Athena
- [ ] aws|analytics|emr|Amazon EMR
- [ ] aws|analytics|kinesis|Amazon Kinesis
- [ ] aws|analytics|redshift|Amazon Redshift
- [ ] aws|analytics|quicksight|Amazon QuickSight
- [ ] aws|analytics|glue|AWS Glue
- [ ] aws|analytics|lake-formation|AWS Lake Formation
- [ ] aws|analytics|opensearch-service|Amazon OpenSearch Service
- [ ] aws|analytics|msk|Amazon MSK
- [ ] aws|analytics|kinesis-data-firehose|Amazon Data Firehose
- [ ] aws|analytics|data-exchange|AWS Data Exchange
- [ ] aws|analytics|clean-rooms|AWS Clean Rooms

### ai-ml
- [ ] aws|ai-ml|sagemaker|Amazon SageMaker
- [ ] aws|ai-ml|bedrock|Amazon Bedrock
- [ ] aws|ai-ml|rekognition|Amazon Rekognition
- [ ] aws|ai-ml|comprehend|Amazon Comprehend
- [ ] aws|ai-ml|polly|Amazon Polly
- [ ] aws|ai-ml|transcribe|Amazon Transcribe
- [ ] aws|ai-ml|translate|Amazon Translate
- [ ] aws|ai-ml|textract|Amazon Textract
- [ ] aws|ai-ml|lex|Amazon Lex
- [ ] aws|ai-ml|kendra|Amazon Kendra
- [ ] aws|ai-ml|personalize|Amazon Personalize
- [ ] aws|ai-ml|forecast|Amazon Forecast
- [ ] aws|ai-ml|fraud-detector|Amazon Fraud Detector
- [ ] aws|ai-ml|q-developer|Amazon Q Developer

### developer-tools
- [ ] aws|developer-tools|codebuild|AWS CodeBuild
- [ ] aws|developer-tools|codedeploy|AWS CodeDeploy
- [ ] aws|developer-tools|codepipeline|AWS CodePipeline
- [ ] aws|developer-tools|codeartifact|AWS CodeArtifact
- [ ] aws|developer-tools|x-ray|AWS X-Ray
- [ ] aws|developer-tools|codecatalyst|Amazon CodeCatalyst
- [ ] aws|developer-tools|codeguru|Amazon CodeGuru

### application-integration
- [ ] aws|application-integration|sns|Amazon SNS
- [ ] aws|application-integration|sqs|Amazon SQS
- [ ] aws|application-integration|eventbridge|Amazon EventBridge
- [ ] aws|application-integration|step-functions|AWS Step Functions
- [ ] aws|application-integration|appflow|Amazon AppFlow
- [ ] aws|application-integration|mq|Amazon MQ
- [ ] aws|application-integration|appsync|AWS AppSync

### management-governance
- [ ] aws|management-governance|cloudwatch|Amazon CloudWatch
- [ ] aws|management-governance|cloudformation|AWS CloudFormation
- [ ] aws|management-governance|cloudtrail|AWS CloudTrail
- [ ] aws|management-governance|config|AWS Config
- [ ] aws|management-governance|systems-manager|AWS Systems Manager
- [ ] aws|management-governance|organizations|AWS Organizations
- [ ] aws|management-governance|control-tower|AWS Control Tower
- [ ] aws|management-governance|service-catalog|AWS Service Catalog
- [ ] aws|management-governance|compute-optimizer|AWS Compute Optimizer
- [ ] aws|management-governance|proton|AWS Proton

### security-identity
- [ ] aws|security-identity|iam|AWS IAM
- [ ] aws|security-identity|cognito|Amazon Cognito
- [ ] aws|security-identity|guardduty|Amazon GuardDuty
- [ ] aws|security-identity|macie|Amazon Macie
- [ ] aws|security-identity|kms|AWS KMS
- [ ] aws|security-identity|secrets-manager|AWS Secrets Manager
- [ ] aws|security-identity|shield|AWS Shield
- [ ] aws|security-identity|waf|AWS WAF
- [ ] aws|security-identity|inspector|Amazon Inspector
- [ ] aws|security-identity|detective|Amazon Detective
- [ ] aws|security-identity|security-hub|AWS Security Hub
- [ ] aws|security-identity|certificate-manager|AWS Certificate Manager
- [ ] aws|security-identity|firewall-manager|AWS Firewall Manager
- [ ] aws|security-identity|iam-identity-center|AWS IAM Identity Center
- [ ] aws|security-identity|private-ca|AWS Private CA
- [ ] aws|security-identity|verified-permissions|Amazon Verified Permissions

### migration
- [ ] aws|migration|migration-hub|AWS Migration Hub
- [ ] aws|migration|dms|AWS Database Migration Service
- [ ] aws|migration|application-migration-service|AWS Application Migration Service
- [ ] aws|migration|transfer-family|AWS Transfer Family
- [ ] aws|migration|mainframe-modernization|AWS Mainframe Modernization

### iot
- [ ] aws|iot|iot-core|AWS IoT Core
- [ ] aws|iot|iot-greengrass|AWS IoT Greengrass
- [ ] aws|iot|iot-sitewise|AWS IoT SiteWise
- [ ] aws|iot|iot-device-management|AWS IoT Device Management
- [ ] aws|iot|iot-twinmaker|AWS IoT TwinMaker

### media
- [ ] aws|media|mediaconvert|AWS Elemental MediaConvert
- [ ] aws|media|medialive|AWS Elemental MediaLive
- [ ] aws|media|mediapackage|AWS Elemental MediaPackage
- [ ] aws|media|ivs|Amazon IVS

### end-user-computing
- [ ] aws|end-user-computing|workspaces|Amazon WorkSpaces
- [ ] aws|end-user-computing|appstream|Amazon AppStream 2.0

### business-apps
- [ ] aws|business-apps|connect|Amazon Connect
- [ ] aws|business-apps|ses|Amazon SES
- [ ] aws|business-apps|pinpoint|Amazon Pinpoint

### specialized
- [ ] aws|specialized|managed-blockchain|Amazon Managed Blockchain
- [ ] aws|specialized|braket|Amazon Braket
- [ ] aws|specialized|ground-station|AWS Ground Station
- [ ] aws|specialized|gamelift|Amazon GameLift
- [ ] aws|specialized|amplify|AWS Amplify

---

## GCP

### ai-ml
- [ ] gcp|ai-ml|vertex-ai|Vertex AI
- [ ] gcp|ai-ml|vertex-ai-vision|Vertex AI Vision
- [ ] gcp|ai-ml|vertex-ai-workbench|Vertex AI Workbench
- [ ] gcp|ai-ml|document-ai|Document AI
- [ ] gcp|ai-ml|vision-api|Vision API
- [ ] gcp|ai-ml|speech-to-text|Speech-to-Text
- [ ] gcp|ai-ml|text-to-speech|Text-to-Speech
- [ ] gcp|ai-ml|translation|Cloud Translation
- [ ] gcp|ai-ml|cloud-tpu|Cloud TPU
- [ ] gcp|ai-ml|enterprise-knowledge-graph|Enterprise Knowledge Graph

### application-development
- [ ] gcp|application-development|api-gateway|API Gateway
- [ ] gcp|application-development|apigee|Apigee
- [ ] gcp|application-development|application-integration|Application Integration
- [ ] gcp|application-development|cloud-build|Cloud Build
- [ ] gcp|application-development|cloud-deploy|Cloud Deploy
- [ ] gcp|application-development|cloud-scheduler|Cloud Scheduler
- [ ] gcp|application-development|cloud-tasks|Cloud Tasks
- [ ] gcp|application-development|cloud-workstations|Cloud Workstations
- [ ] gcp|application-development|eventarc|Eventarc
- [ ] gcp|application-development|pubsub|Pub/Sub
- [ ] gcp|application-development|workflows|Workflows
- [ ] gcp|application-development|artifact-registry|Artifact Registry

### application-hosting
- [ ] gcp|application-hosting|app-engine|App Engine
- [ ] gcp|application-hosting|cloud-run|Cloud Run
- [ ] gcp|application-hosting|gke|Google Kubernetes Engine

### compute
- [ ] gcp|compute|compute-engine|Compute Engine
- [ ] gcp|compute|batch|Batch
- [ ] gcp|compute|migrate-to-containers|Migrate to Containers
- [ ] gcp|compute|migrate-to-vms|Migrate to Virtual Machines
- [ ] gcp|compute|vmware-engine|Google Cloud VMware Engine
- [ ] gcp|compute|shielded-vms|Shielded VMs

### data-analytics
- [ ] gcp|data-analytics|bigquery|BigQuery
- [ ] gcp|data-analytics|dataflow|Dataflow
- [ ] gcp|data-analytics|dataform|Dataform
- [ ] gcp|data-analytics|datastream|Datastream
- [ ] gcp|data-analytics|cloud-data-fusion|Cloud Data Fusion
- [ ] gcp|data-analytics|looker|Looker
- [ ] gcp|data-analytics|managed-airflow|Cloud Composer (Managed Airflow)
- [ ] gcp|data-analytics|managed-spark|Dataproc (Managed Spark)

### databases
- [ ] gcp|databases|alloydb|AlloyDB for PostgreSQL
- [ ] gcp|databases|bigtable|Bigtable
- [ ] gcp|databases|cloud-sql|Cloud SQL
- [ ] gcp|databases|firestore|Firestore
- [ ] gcp|databases|memorystore|Memorystore
- [ ] gcp|databases|spanner|Spanner
- [ ] gcp|databases|database-migration-service|Database Migration Service

### networking
- [ ] gcp|networking|vpc|Virtual Private Cloud (VPC)
- [ ] gcp|networking|cloud-cdn|Cloud CDN
- [ ] gcp|networking|cloud-dns|Cloud DNS
- [ ] gcp|networking|cloud-load-balancing|Cloud Load Balancing
- [ ] gcp|networking|cloud-interconnect|Cloud Interconnect
- [ ] gcp|networking|cloud-nat|Cloud NAT
- [ ] gcp|networking|cloud-vpn|Cloud VPN
- [ ] gcp|networking|cloud-armor|Google Cloud Armor
- [ ] gcp|networking|cloud-ngfw|Cloud Next Generation Firewall
- [ ] gcp|networking|cloud-router|Cloud Router
- [ ] gcp|networking|cloud-service-mesh|Cloud Service Mesh
- [ ] gcp|networking|media-cdn|Media CDN
- [ ] gcp|networking|network-connectivity-center|Network Connectivity Center

### observability
- [ ] gcp|observability|cloud-logging|Cloud Logging
- [ ] gcp|observability|cloud-monitoring|Cloud Monitoring
- [ ] gcp|observability|cloud-trace|Cloud Trace
- [ ] gcp|observability|cloud-profiler|Cloud Profiler
- [ ] gcp|observability|error-reporting|Error Reporting

### security
- [ ] gcp|security|iam|Identity and Access Management (IAM)
- [ ] gcp|security|cloud-kms|Cloud KMS
- [ ] gcp|security|secret-manager|Secret Manager
- [ ] gcp|security|security-command-center|Security Command Center
- [ ] gcp|security|certificate-authority-service|Certificate Authority Service
- [ ] gcp|security|certificate-manager|Certificate Manager
- [ ] gcp|security|binary-authorization|Binary Authorization
- [ ] gcp|security|cloud-asset-inventory|Cloud Asset Inventory
- [ ] gcp|security|identity-aware-proxy|Identity-Aware Proxy
- [ ] gcp|security|sensitive-data-protection|Sensitive Data Protection
- [ ] gcp|security|confidential-vm|Confidential VM
- [ ] gcp|security|recaptcha|reCAPTCHA Enterprise
- [ ] gcp|security|vpc-service-controls|VPC Service Controls

### storage
- [ ] gcp|storage|cloud-storage|Cloud Storage
- [ ] gcp|storage|filestore|Filestore
- [ ] gcp|storage|backup-and-dr|Backup and DR Service

### management
- [ ] gcp|management|cloud-billing|Cloud Billing
- [ ] gcp|management|cloud-identity|Cloud Identity
- [ ] gcp|management|identity-platform|Identity Platform
- [ ] gcp|management|infrastructure-manager|Infrastructure Manager
- [ ] gcp|management|resource-manager|Resource Manager
- [ ] gcp|management|service-catalog|Service Catalog

---

## Azure

### ai-ml
- [ ] azure|ai-ml|azure-machine-learning|Azure Machine Learning
- [ ] azure|ai-ml|azure-openai|Azure OpenAI Service
- [ ] azure|ai-ml|azure-ai-search|Azure AI Search
- [ ] azure|ai-ml|azure-ai-vision|Azure AI Vision
- [ ] azure|ai-ml|azure-ai-language|Azure AI Language
- [ ] azure|ai-ml|azure-ai-speech|Azure AI Speech
- [ ] azure|ai-ml|azure-ai-document-intelligence|Azure AI Document Intelligence
- [ ] azure|ai-ml|azure-ai-translator|Azure AI Translator
- [ ] azure|ai-ml|azure-bot-service|Azure Bot Service
- [ ] azure|ai-ml|azure-ai-content-safety|Azure AI Content Safety
- [ ] azure|ai-ml|azure-ai-foundry|Azure AI Foundry

### compute
- [ ] azure|compute|virtual-machines|Azure Virtual Machines
- [ ] azure|compute|vm-scale-sets|Azure VM Scale Sets
- [ ] azure|compute|azure-functions|Azure Functions
- [ ] azure|compute|app-service|Azure App Service
- [ ] azure|compute|azure-batch|Azure Batch
- [ ] azure|compute|azure-vmware-solution|Azure VMware Solution
- [ ] azure|compute|azure-dedicated-host|Azure Dedicated Host

### containers
- [ ] azure|containers|aks|Azure Kubernetes Service (AKS)
- [ ] azure|containers|container-instances|Azure Container Instances
- [ ] azure|containers|container-apps|Azure Container Apps
- [ ] azure|containers|container-registry|Azure Container Registry
- [ ] azure|containers|service-fabric|Azure Service Fabric

### databases
- [ ] azure|databases|azure-sql-database|Azure SQL Database
- [ ] azure|databases|sql-managed-instance|Azure SQL Managed Instance
- [ ] azure|databases|cosmos-db|Azure Cosmos DB
- [ ] azure|databases|azure-database-for-postgresql|Azure Database for PostgreSQL
- [ ] azure|databases|azure-database-for-mysql|Azure Database for MySQL
- [ ] azure|databases|azure-cache-for-redis|Azure Cache for Redis
- [ ] azure|databases|managed-instance-for-cassandra|Azure Managed Instance for Apache Cassandra

### storage
- [ ] azure|storage|blob-storage|Azure Blob Storage
- [ ] azure|storage|azure-files|Azure Files
- [ ] azure|storage|azure-disk-storage|Azure Disk Storage
- [ ] azure|storage|azure-queue-storage|Azure Queue Storage
- [ ] azure|storage|table-storage|Azure Table Storage
- [ ] azure|storage|data-lake-storage|Azure Data Lake Storage
- [ ] azure|storage|azure-netapp-files|Azure NetApp Files
- [ ] azure|storage|azure-backup|Azure Backup
- [ ] azure|storage|azure-data-box|Azure Data Box

### networking
- [ ] azure|networking|virtual-network|Azure Virtual Network
- [ ] azure|networking|load-balancer|Azure Load Balancer
- [ ] azure|networking|application-gateway|Azure Application Gateway
- [ ] azure|networking|vpn-gateway|Azure VPN Gateway
- [ ] azure|networking|azure-dns|Azure DNS
- [ ] azure|networking|azure-firewall|Azure Firewall
- [ ] azure|networking|front-door|Azure Front Door
- [ ] azure|networking|traffic-manager|Azure Traffic Manager
- [ ] azure|networking|expressroute|Azure ExpressRoute
- [ ] azure|networking|azure-bastion|Azure Bastion
- [ ] azure|networking|ddos-protection|Azure DDoS Protection
- [ ] azure|networking|private-link|Azure Private Link
- [ ] azure|networking|virtual-wan|Azure Virtual WAN
- [ ] azure|networking|cdn|Azure CDN

### analytics
- [ ] azure|analytics|azure-synapse-analytics|Azure Synapse Analytics
- [ ] azure|analytics|azure-databricks|Azure Databricks
- [ ] azure|analytics|hdinsight|Azure HDInsight
- [ ] azure|analytics|data-factory|Azure Data Factory
- [ ] azure|analytics|stream-analytics|Azure Stream Analytics
- [ ] azure|analytics|event-hubs|Azure Event Hubs
- [ ] azure|analytics|data-explorer|Azure Data Explorer
- [ ] azure|analytics|microsoft-purview|Microsoft Purview

### integration
- [ ] azure|integration|logic-apps|Azure Logic Apps
- [ ] azure|integration|service-bus|Azure Service Bus
- [ ] azure|integration|api-management|Azure API Management
- [ ] azure|integration|event-grid|Azure Event Grid

### iot
- [ ] azure|iot|iot-hub|Azure IoT Hub
- [ ] azure|iot|iot-central|Azure IoT Central
- [ ] azure|iot|iot-edge|Azure IoT Edge
- [ ] azure|iot|digital-twins|Azure Digital Twins

### identity
- [ ] azure|identity|microsoft-entra-id|Microsoft Entra ID
- [ ] azure|identity|entra-id-b2c|Microsoft Entra External ID (B2C)
- [ ] azure|identity|entra-domain-services|Microsoft Entra Domain Services
- [ ] azure|identity|entra-id-governance|Microsoft Entra ID Governance

### security
- [ ] azure|security|microsoft-defender-for-cloud|Microsoft Defender for Cloud
- [ ] azure|security|microsoft-sentinel|Microsoft Sentinel
- [ ] azure|security|key-vault|Azure Key Vault
- [ ] azure|security|azure-dedicated-hsm|Azure Dedicated HSM
- [ ] azure|security|attestation|Azure Attestation

### management-governance
- [ ] azure|management-governance|azure-monitor|Azure Monitor
- [ ] azure|management-governance|azure-policy|Azure Policy
- [ ] azure|management-governance|azure-resource-manager|Azure Resource Manager
- [ ] azure|management-governance|azure-cost-management|Microsoft Cost Management
- [ ] azure|management-governance|azure-automation|Azure Automation
- [ ] azure|management-governance|azure-arc|Azure Arc
- [ ] azure|management-governance|azure-advisor|Azure Advisor
- [ ] azure|management-governance|log-analytics|Azure Log Analytics
- [ ] azure|management-governance|application-insights|Application Insights

### devops
- [ ] azure|devops|azure-devops|Azure DevOps
- [ ] azure|devops|azure-pipelines|Azure Pipelines
- [ ] azure|devops|azure-artifacts|Azure Artifacts
- [ ] azure|devops|azure-load-testing|Azure Load Testing
- [ ] azure|devops|dev-box|Microsoft Dev Box

### migration
- [ ] azure|migration|azure-migrate|Azure Migrate
- [ ] azure|migration|azure-site-recovery|Azure Site Recovery
- [ ] azure|migration|database-migration-service|Azure Database Migration Service

### web-mobile
- [ ] azure|web-mobile|static-web-apps|Azure Static Web Apps
- [ ] azure|web-mobile|azure-maps|Azure Maps
- [ ] azure|web-mobile|notification-hubs|Azure Notification Hubs
- [ ] azure|web-mobile|azure-signalr-service|Azure SignalR Service
- [ ] azure|web-mobile|azure-communication-services|Azure Communication Services

### hybrid
- [ ] azure|hybrid|azure-stack-hci|Azure Stack HCI
- [ ] azure|hybrid|azure-stack-edge|Azure Stack Edge
