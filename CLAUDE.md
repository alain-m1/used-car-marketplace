# AI Collaboration Blueprint & Project Context (`CLAUDE.md`)

This document serves as the master context and behavioral directive framework for AI-assisted development sessions on the Used Car E-Commerce Marketplace platform.

## 1. Project Overview & Background
- **Project Goal:** A multi-tier, full-stack Used Car E-Commerce Marketplace that enables users to publish and manage vehicle inventories, utilize high-performance cached search filters (make, model, price, mileage), read interactive marketplace data metrics (view tracking, price averaging), securely authenticate user profiles, and facilitate direct buyer-to-seller messaging.
- **Development Lifecycle:** The core application architecture and early containerized prototypes were conceptualized in late 2025. Development was intentionally paused to conduct a comprehensive structural audit of the cloud provisioning layer, identifying significant over-provisioning in the legacy infrastructure footprint. 
- **Reboot Objective:** This session establishes an active refactoring cycle to gain deep, hands-on exposure to advanced AWS networking, master modern human-in-the-loop AI collaboration workflows, and practice high-discipline full-stack and Docker orchestration.

## 2. Technology Stack
- **Frontend:** React, Tailwind CSS (Vite Build Framework)
- **Backend:** Spring Boot (Java), Redis (Spring Cache Abstraction)
- **Database:** PostgreSQL
- **DevOps/Infra:** Docker, Docker Compose, AWS CloudFormation

## 3. Strict Budget & AWS Guardrails
- **Core Optimization Target:** The baseline cloud architecture featured redundant enterprise topologies. The objective of this refactoring phase is a **Cost-Managed Portfolio Environment** balancing strict operational budget boundaries with hands-on multi-service visibility.
- **Service Retention Constraint:** To maintain deep exposure to core cloud patterns, all target services must remain fully integrated within the single-instance footprint: **VPC, RDS, S3, Cognito, ECS, and an Application Load Balancer (ALB)**. Do not delete or substitute these core architectural tiers.
- **AWS Environment & Promotional Credits:** Running on an AWS Free Tier infrastructure backed by a specialized **\$200 credit promotional allocation** spanning a 6-month window. 
- **Target Run Profile:** The execution budget targets an aggressive **3-month operational window (~\$66/month cap)** for active deployment, validation, and testing phases. Resources are configured to allow rapid environment teardown or pausing during inactive development phases to preserve the credit buffer.
- **Account Clean Slate:** Any hardcoded AWS Account IDs, IAM ARN roots, or baseline access parameters present in legacy configuration files belong to a decommissioned environment and must be updated dynamically.
- **Target AWS Region:** Strict localized enforcement within **us-east-2 (Ohio)**. All parameter blocks, regional structures, and container resources must default strictly to this zone. Ignore legacy references to `us-west-2` or other regions.
- **Compute & Instance Sizing Caps:**
  - **ECS Fargate Compute Tiers:** Hardcapped at the absolute lowest allowable Fargate dimensions: **0.25 vCPU (256 CPU units) and 0.5 GB (512 MB) of Memory** per container task. This prevents over-provisioning and maximizes credit runtime.
  - **Relational Database Engine (RDS):** Scaled strictly to `db.t4g.micro` (Burstable Graviton pricing tier, matches standard Free Tier boundaries).

## 4. Architectural Refactoring Tasks

### Task A: VPC CloudFormation Optimization
Refactor the legacy VPC CloudFormation template using these cost-pruning criteria:
1. **Update Target Region:** Align the `AvailabilityZones` parameter defaults to target `us-east-2a, us-east-2b, us-east-2c`.
2. **Strip High-Cost Networking:** Completely delete the redundant `NatGateway1EIP`, `NatGateway2EIP`, `NatGateway3EIP`, `NatGateway1`, `NatGateway2`, and `NatGateway3` resources to eliminate base hourly gateway tracking costs.
3. **Prune Private Routes:** Remove `PrivateRouteTable1`, `PrivateRouteTable2`, `PrivateRouteTable3`, and their associated `DefaultPrivateRoute` blocks.
4. **Converge Subnet Routing to Public Internet Gateway:** Modify all three `PrivateSubnetRouteTableAssociation` blocks to map cleanly to the unified `PublicRouteTable`. Inject `MapPublicIpOnLaunch: true` across these subnets to guarantee outbound internet communication access without a NAT footprint.
5. **Preserve Downstream Exports:** Retain the `Outputs` blocks exactly as named to prevent breaking dependency lookups in downstream infrastructure scripts relying on the `PrivateSubnets` export keys.

### Task B: RDS PostgreSQL CloudFormation Optimization
Refactor the database provisioning script (`03-rds.yaml`) using these budget criteria:
1. **Enforce Instance Sizing:** Set default `DBInstanceClass` to `db.t4g.micro`.
2. **Swap Environment Default:** Transition the default value of the `Environment` parameter from `production` to `development`.
3. **Eliminate Database Replication:** Delete the `DBReadReplica` block and the `IsProduction` condition entirely to ensure we do not provision dual billable database engines.
4. **Remove Costly Monitoring & Alarms:** Set `EnablePerformanceInsights: false` and `MonitoringInterval: 0`. Strip the `RDSEnhancedMonitoringRole`, `DBHighCPUAlarm`, `DBHighConnectionsAlarm`, `DBLowFreeStorageAlarm`, `DBAlarmTopic`, and `DBLogGroup` resources to eliminate metric polling fees.
5. **Optimize Credentials Flow:** Flag the `DBSecret` and `DBSecretAttachment` blocks for migration away from premium AWS Secrets Manager, planning a refactor to inject credentials securely into Spring Boot containers via secure environment configurations.
6. **Remove Deletion Protection:** Set `DeletionProtection: false` to allow seamless environment teardown cycles.
7. **Keep Necessary Outputs:** Retain `DBInstanceEndpoint`, `DBInstancePort`, and `DBName` exports, cleanly dropping `DBSecretArn` and `DBReadReplicaEndpoint`.

### Task C: ECS Compute Tier Infrastructure Optimization
Refactor container orchestration parameters using these criteria:
1. **Enforce Capacity Strategies:** Adjust `DefaultCapacityProviderStrategy` to map 100% of compute execution to `FARGATE_SPOT` (Weight: 4, regular FARGATE: 0) to capture maximum serverless cost-reductions.
2. **Protect Application Load Balancing:** Maintain the `ApplicationLoadBalancer` infrastructure and ingress targets intact to fulfill portfolio presentation requirements.
3. **Prune IAM Policy Scope:** Schedule the removal or redirection of the `SecretsManagerAccess` sub-policy blocks inside `ECSTaskExecutionRole`.

### Task D: S3, CloudFront, and Cognito Architecture Tuning
1. **Preserve Resume Visibility Footprint:** Maintain `S3`, `CloudFront`, `Cognito User/Identity Pools`, and the sign-up `Lambda Trigger` configuration intact.
2. **Correct Outputs Syntax:** Complete the truncated string value inside the `CognitoUserPoolDomainUrl` output block to map explicitly to `!Sub https://${CognitoUserPool}.auth.${AWS::Region}.amazoncognito.com`.
3. **Local Dev Resiliency:** Ensure environment parameter fallback chains fully support `http://localhost:3000` callback, logout, and CORS configurations.
4. **Align Geographic Targets:** Enforce `VITE_AWS_REGION=us-east-2` across frontend clients.

### Task E: Local Docker Compose & Mocking Alignment
1. **Isolate Development Telemetry:** Enforce Docker configuration profiles (`monitoring`, `logging`) to leave local heavy telemetry tools (ELK Stack, Prometheus, Jaeger) disabled by default. Do not map these profiles to AWS ECS tasks.
2. **Map Cache Topology to Fargate:** Configure the application layout to spin up the local `redis:7.2-alpine` footprint as a Fargate Spot sidecar task container upon AWS migration, bypassing premium managed ElastiCache costs.
3. **Correct Environment Region Variables:** Synchronize the hardcoded local `AWS_REGION: us-east-1` under the backend application service block to target **us-east-2**.

### Task F: Containerization and NGINX Build Cleanliness
1. **Verify Frontend Distribution Outputs:** Confirm that the React environment correctly builds into the standard Vite output directory (`/app/dist`), matching the current frontend Dockerfile compilation pipeline.
2. **Decouple Proxy Routing Layers:** Abstract the internal bridge network target `proxy_pass http://backend:8080;` inside the `nginx.conf` template, shifting cloud API request-routing logic entirely to the AWS Application Load Balancer listener patterns.

### Task G: Java Source Code & Dependency Refactoring
1. **Migrate to AWS SDK v2:** Rewrite `AWSConfig.java` to use modern AWS SDK v2 namespaces (`software.amazon.awssdk.services.s3.*` and `software.amazon.awssdk.services.cognitoidentityprovider.*`) to resolve deprecation risk and optimize IAM token evaluation within Fargate tasks.
2. **Default Regional Fallback:** Update the default expression `@Value("${aws.region:us-east-1}")` inside `AWSConfig.java` to fallback directly to `us-east-2`.
3. **Validate Spring Caching Infrastructure:** Maintain `@Cacheable` and `@CacheEvict` method architectures across `CarListingService` and `UserService` targeting the localized Lettuce standalone memory provider pool.
4. **Domain Services Baseline:** Maintain business logic tracking across `CarListingService`, `UserService`, and `MessageService` layouts without modifying core data access schemas until infrastructure refactoring tasks A-F are resolved.

## 5. Scope of Work for Claude Action Sessions
1. **Incremental Architecture Building:** Conduct code refactoring iteratively, resolving tasks sequentially to maintain strict tracking control.
2. **Dependency & System Audit:** Validate project software libraries, checking Java Spring Boot dependencies and Vite configs for version alignment and stability.
