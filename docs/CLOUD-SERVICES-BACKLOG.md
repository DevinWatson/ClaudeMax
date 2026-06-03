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
- [x] aws|storage|ebs|Amazon EBS
- [x] aws|storage|efs|Amazon EFS
- [x] aws|storage|fsx|Amazon FSx
- [x] aws|storage|s3-glacier|Amazon S3 Glacier
- [x] aws|storage|storage-gateway|AWS Storage Gateway
- [x] aws|storage|backup|AWS Backup
- [x] aws|storage|datasync|AWS DataSync
- [x] aws|storage|snow-family|AWS Snow Family

### databases
- [x] aws|databases|rds|Amazon RDS
- [x] aws|databases|aurora|Amazon Aurora
- [x] aws|databases|dynamodb|Amazon DynamoDB
- [x] aws|databases|documentdb|Amazon DocumentDB
- [x] aws|databases|neptune|Amazon Neptune
- [x] aws|databases|elasticache|Amazon ElastiCache
- [x] aws|databases|memorydb|Amazon MemoryDB
- [x] aws|databases|keyspaces|Amazon Keyspaces
- [x] aws|databases|timestream|Amazon Timestream
- [x] aws|databases|qldb|Amazon QLDB
- [x] aws|databases|dax|DynamoDB Accelerator (DAX)

### networking
- [x] aws|networking|vpc|Amazon VPC
- [x] aws|networking|cloudfront|Amazon CloudFront
- [x] aws|networking|route53|Amazon Route 53
- [x] aws|networking|api-gateway|Amazon API Gateway
- [x] aws|networking|direct-connect|AWS Direct Connect
- [x] aws|networking|vpn|AWS VPN
- [x] aws|networking|transit-gateway|AWS Transit Gateway
- [x] aws|networking|global-accelerator|AWS Global Accelerator
- [x] aws|networking|cloud-map|AWS Cloud Map
- [x] aws|networking|privatelink|AWS PrivateLink
- [x] aws|networking|elastic-load-balancing|Elastic Load Balancing
- [x] aws|networking|network-firewall|AWS Network Firewall

### analytics
- [x] aws|analytics|athena|Amazon Athena
- [x] aws|analytics|emr|Amazon EMR
- [x] aws|analytics|kinesis|Amazon Kinesis
- [x] aws|analytics|redshift|Amazon Redshift
- [x] aws|analytics|quicksight|Amazon QuickSight
- [x] aws|analytics|glue|AWS Glue
- [x] aws|analytics|lake-formation|AWS Lake Formation
- [x] aws|analytics|opensearch-service|Amazon OpenSearch Service
- [x] aws|analytics|msk|Amazon MSK
- [x] aws|analytics|kinesis-data-firehose|Amazon Data Firehose
- [x] aws|analytics|data-exchange|AWS Data Exchange
- [x] aws|analytics|clean-rooms|AWS Clean Rooms

### ai-ml
- [x] aws|ai-ml|sagemaker|Amazon SageMaker
- [x] aws|ai-ml|bedrock|Amazon Bedrock
- [x] aws|ai-ml|rekognition|Amazon Rekognition
- [x] aws|ai-ml|comprehend|Amazon Comprehend
- [x] aws|ai-ml|polly|Amazon Polly
- [x] aws|ai-ml|transcribe|Amazon Transcribe
- [x] aws|ai-ml|translate|Amazon Translate
- [x] aws|ai-ml|textract|Amazon Textract
- [x] aws|ai-ml|lex|Amazon Lex
- [x] aws|ai-ml|kendra|Amazon Kendra
- [x] aws|ai-ml|personalize|Amazon Personalize
- [x] aws|ai-ml|forecast|Amazon Forecast
- [x] aws|ai-ml|fraud-detector|Amazon Fraud Detector
- [x] aws|ai-ml|q-developer|Amazon Q Developer

### developer-tools
- [x] aws|developer-tools|codebuild|AWS CodeBuild
- [x] aws|developer-tools|codedeploy|AWS CodeDeploy
- [x] aws|developer-tools|codepipeline|AWS CodePipeline
- [x] aws|developer-tools|codeartifact|AWS CodeArtifact
- [x] aws|developer-tools|x-ray|AWS X-Ray
- [x] aws|developer-tools|codecatalyst|Amazon CodeCatalyst
- [x] aws|developer-tools|codeguru|Amazon CodeGuru

### application-integration
- [x] aws|application-integration|sns|Amazon SNS
- [x] aws|application-integration|sqs|Amazon SQS
- [x] aws|application-integration|eventbridge|Amazon EventBridge
- [x] aws|application-integration|step-functions|AWS Step Functions
- [x] aws|application-integration|appflow|Amazon AppFlow
- [x] aws|application-integration|mq|Amazon MQ
- [x] aws|application-integration|appsync|AWS AppSync

### management-governance
- [x] aws|management-governance|cloudwatch|Amazon CloudWatch
- [x] aws|management-governance|cloudformation|AWS CloudFormation
- [x] aws|management-governance|cloudtrail|AWS CloudTrail
- [x] aws|management-governance|config|AWS Config
- [x] aws|management-governance|systems-manager|AWS Systems Manager
- [x] aws|management-governance|organizations|AWS Organizations
- [x] aws|management-governance|control-tower|AWS Control Tower
- [x] aws|management-governance|service-catalog|AWS Service Catalog
- [x] aws|management-governance|compute-optimizer|AWS Compute Optimizer
- [x] aws|management-governance|proton|AWS Proton

### security-identity
- [x] aws|security-identity|iam|AWS IAM
- [x] aws|security-identity|cognito|Amazon Cognito
- [x] aws|security-identity|guardduty|Amazon GuardDuty
- [x] aws|security-identity|macie|Amazon Macie
- [x] aws|security-identity|kms|AWS KMS
- [x] aws|security-identity|secrets-manager|AWS Secrets Manager
- [x] aws|security-identity|shield|AWS Shield
- [x] aws|security-identity|waf|AWS WAF
- [x] aws|security-identity|inspector|Amazon Inspector
- [x] aws|security-identity|detective|Amazon Detective
- [x] aws|security-identity|security-hub|AWS Security Hub
- [x] aws|security-identity|certificate-manager|AWS Certificate Manager
- [x] aws|security-identity|firewall-manager|AWS Firewall Manager
- [x] aws|security-identity|iam-identity-center|AWS IAM Identity Center
- [x] aws|security-identity|private-ca|AWS Private CA
- [x] aws|security-identity|verified-permissions|Amazon Verified Permissions

### migration
- [x] aws|migration|migration-hub|AWS Migration Hub
- [x] aws|migration|dms|AWS Database Migration Service
- [x] aws|migration|application-migration-service|AWS Application Migration Service
- [x] aws|migration|transfer-family|AWS Transfer Family
- [x] aws|migration|mainframe-modernization|AWS Mainframe Modernization

### iot
- [x] aws|iot|iot-core|AWS IoT Core
- [x] aws|iot|iot-greengrass|AWS IoT Greengrass
- [x] aws|iot|iot-sitewise|AWS IoT SiteWise
- [x] aws|iot|iot-device-management|AWS IoT Device Management
- [x] aws|iot|iot-twinmaker|AWS IoT TwinMaker

### media
- [x] aws|media|mediaconvert|AWS Elemental MediaConvert
- [x] aws|media|medialive|AWS Elemental MediaLive
- [x] aws|media|mediapackage|AWS Elemental MediaPackage
- [x] aws|media|ivs|Amazon IVS

### end-user-computing
- [x] aws|end-user-computing|workspaces|Amazon WorkSpaces
- [x] aws|end-user-computing|appstream|Amazon AppStream 2.0

### business-apps
- [x] aws|business-apps|connect|Amazon Connect
- [x] aws|business-apps|ses|Amazon SES
- [x] aws|business-apps|pinpoint|Amazon Pinpoint

### specialized
- [x] aws|specialized|managed-blockchain|Amazon Managed Blockchain
- [x] aws|specialized|braket|Amazon Braket
- [x] aws|specialized|ground-station|AWS Ground Station
- [x] aws|specialized|gamelift|Amazon GameLift
- [x] aws|specialized|amplify|AWS Amplify

---

## GCP

### ai-ml
- [x] gcp|ai-ml|vertex-ai|Vertex AI
- [x] gcp|ai-ml|vertex-ai-vision|Vertex AI Vision
- [x] gcp|ai-ml|vertex-ai-workbench|Vertex AI Workbench
- [x] gcp|ai-ml|document-ai|Document AI
- [x] gcp|ai-ml|vision-api|Vision API
- [x] gcp|ai-ml|speech-to-text|Speech-to-Text
- [x] gcp|ai-ml|text-to-speech|Text-to-Speech
- [x] gcp|ai-ml|translation|Cloud Translation
- [x] gcp|ai-ml|cloud-tpu|Cloud TPU
- [x] gcp|ai-ml|enterprise-knowledge-graph|Enterprise Knowledge Graph

### application-development
- [x] gcp|application-development|api-gateway|API Gateway
- [x] gcp|application-development|apigee|Apigee
- [x] gcp|application-development|application-integration|Application Integration
- [x] gcp|application-development|cloud-build|Cloud Build
- [x] gcp|application-development|cloud-deploy|Cloud Deploy
- [x] gcp|application-development|cloud-scheduler|Cloud Scheduler
- [x] gcp|application-development|cloud-tasks|Cloud Tasks
- [x] gcp|application-development|cloud-workstations|Cloud Workstations
- [x] gcp|application-development|eventarc|Eventarc
- [x] gcp|application-development|pubsub|Pub/Sub
- [x] gcp|application-development|workflows|Workflows
- [x] gcp|application-development|artifact-registry|Artifact Registry

### application-hosting
- [x] gcp|application-hosting|app-engine|App Engine
- [x] gcp|application-hosting|cloud-run|Cloud Run
- [x] gcp|application-hosting|gke|Google Kubernetes Engine

### compute
- [x] gcp|compute|compute-engine|Compute Engine
- [x] gcp|compute|batch|Batch
- [x] gcp|compute|migrate-to-containers|Migrate to Containers
- [x] gcp|compute|migrate-to-vms|Migrate to Virtual Machines
- [x] gcp|compute|vmware-engine|Google Cloud VMware Engine
- [x] gcp|compute|shielded-vms|Shielded VMs

### data-analytics
- [x] gcp|data-analytics|bigquery|BigQuery
- [x] gcp|data-analytics|dataflow|Dataflow
- [x] gcp|data-analytics|dataform|Dataform
- [x] gcp|data-analytics|datastream|Datastream
- [x] gcp|data-analytics|cloud-data-fusion|Cloud Data Fusion
- [x] gcp|data-analytics|looker|Looker
- [x] gcp|data-analytics|managed-airflow|Cloud Composer (Managed Airflow)
- [x] gcp|data-analytics|managed-spark|Dataproc (Managed Spark)

### databases
- [x] gcp|databases|alloydb|AlloyDB for PostgreSQL
- [x] gcp|databases|bigtable|Bigtable
- [x] gcp|databases|cloud-sql|Cloud SQL
- [x] gcp|databases|firestore|Firestore
- [x] gcp|databases|memorystore|Memorystore
- [x] gcp|databases|spanner|Spanner
- [x] gcp|databases|database-migration-service|Database Migration Service

### networking
- [x] gcp|networking|vpc|Virtual Private Cloud (VPC)
- [x] gcp|networking|cloud-cdn|Cloud CDN
- [x] gcp|networking|cloud-dns|Cloud DNS
- [x] gcp|networking|cloud-load-balancing|Cloud Load Balancing
- [x] gcp|networking|cloud-interconnect|Cloud Interconnect
- [x] gcp|networking|cloud-nat|Cloud NAT
- [x] gcp|networking|cloud-vpn|Cloud VPN
- [x] gcp|networking|cloud-armor|Google Cloud Armor
- [x] gcp|networking|cloud-ngfw|Cloud Next Generation Firewall
- [x] gcp|networking|cloud-router|Cloud Router
- [x] gcp|networking|cloud-service-mesh|Cloud Service Mesh
- [x] gcp|networking|media-cdn|Media CDN
- [x] gcp|networking|network-connectivity-center|Network Connectivity Center

### observability
- [x] gcp|observability|cloud-logging|Cloud Logging
- [x] gcp|observability|cloud-monitoring|Cloud Monitoring
- [x] gcp|observability|cloud-trace|Cloud Trace
- [x] gcp|observability|cloud-profiler|Cloud Profiler
- [x] gcp|observability|error-reporting|Error Reporting

### security
- [x] gcp|security|iam|Identity and Access Management (IAM)
- [x] gcp|security|cloud-kms|Cloud KMS
- [x] gcp|security|secret-manager|Secret Manager
- [x] gcp|security|security-command-center|Security Command Center
- [x] gcp|security|certificate-authority-service|Certificate Authority Service
- [x] gcp|security|certificate-manager|Certificate Manager
- [x] gcp|security|binary-authorization|Binary Authorization
- [x] gcp|security|cloud-asset-inventory|Cloud Asset Inventory
- [x] gcp|security|identity-aware-proxy|Identity-Aware Proxy
- [x] gcp|security|sensitive-data-protection|Sensitive Data Protection
- [x] gcp|security|confidential-vm|Confidential VM
- [x] gcp|security|recaptcha|reCAPTCHA Enterprise
- [x] gcp|security|vpc-service-controls|VPC Service Controls

### storage
- [x] gcp|storage|cloud-storage|Cloud Storage
- [x] gcp|storage|filestore|Filestore
- [x] gcp|storage|backup-and-dr|Backup and DR Service

### management
- [x] gcp|management|cloud-billing|Cloud Billing
- [x] gcp|management|cloud-identity|Cloud Identity
- [x] gcp|management|identity-platform|Identity Platform
- [x] gcp|management|infrastructure-manager|Infrastructure Manager
- [x] gcp|management|resource-manager|Resource Manager
- [x] gcp|management|service-catalog|Service Catalog

---

## Azure

### ai-ml
- [x] azure|ai-ml|azure-machine-learning|Azure Machine Learning
- [x] azure|ai-ml|azure-openai|Azure OpenAI Service
- [x] azure|ai-ml|azure-ai-search|Azure AI Search
- [x] azure|ai-ml|azure-ai-vision|Azure AI Vision
- [x] azure|ai-ml|azure-ai-language|Azure AI Language
- [x] azure|ai-ml|azure-ai-speech|Azure AI Speech
- [x] azure|ai-ml|azure-ai-document-intelligence|Azure AI Document Intelligence
- [x] azure|ai-ml|azure-ai-translator|Azure AI Translator
- [x] azure|ai-ml|azure-bot-service|Azure Bot Service
- [x] azure|ai-ml|azure-ai-content-safety|Azure AI Content Safety
- [x] azure|ai-ml|azure-ai-foundry|Azure AI Foundry

### compute
- [x] azure|compute|virtual-machines|Azure Virtual Machines
- [x] azure|compute|vm-scale-sets|Azure VM Scale Sets
- [x] azure|compute|azure-functions|Azure Functions
- [x] azure|compute|app-service|Azure App Service
- [x] azure|compute|azure-batch|Azure Batch
- [x] azure|compute|azure-vmware-solution|Azure VMware Solution
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
