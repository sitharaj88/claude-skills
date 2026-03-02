---
name: aws-ec2
description: Generate AWS EC2 instance configurations, launch templates, Auto Scaling Groups, user data scripts, and AMI configurations. Use when the user wants to set up EC2 instances or auto-scaling infrastructure.
argument-hint: "[instance type] [os] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS EC2 infrastructure expert. Generate production-ready EC2 configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Instance type**: t3.micro to metal instances, compute/memory/storage optimized
- **OS**: Amazon Linux 2023, Ubuntu 24.04, Windows Server, RHEL, custom AMI
- **Purpose**: web server, application server, database, bastion host, build server
- **Scaling**: single instance, ASG, spot fleet

### Step 2: Generate launch template

Create a launch template (CloudFormation/Terraform) with:
- Instance type and AMI ID
- Security group with minimal inbound rules
- IAM instance profile with least-privilege role
- EBS volumes (type, size, encryption, IOPS)
- Network interface configuration
- Metadata options (IMDSv2 required)
- Monitoring enabled (detailed or basic)
- Tags for cost allocation

### Step 3: Generate user data script

Create an appropriate bootstrap script:

**Amazon Linux / Ubuntu:**
- Package updates and essential installs
- Application deployment
- CloudWatch agent installation
- SSM agent verification
- Log rotation configuration
- Security hardening (disable root SSH, configure fail2ban)

**Windows:**
- PowerShell bootstrap with EC2Launch v2
- IIS or application setup
- CloudWatch agent
- Windows Update configuration

### Step 4: Auto Scaling Group (if applicable)

Generate ASG configuration with:
- Min/max/desired capacity
- Scaling policies (target tracking, step, scheduled)
- Health check configuration (EC2 or ELB)
- Mixed instances policy (On-Demand + Spot)
- Instance refresh configuration
- Warm pool if needed
- ALB/NLB target group attachment

### Step 5: Supporting resources

- Security group rules (ingress/egress)
- Elastic IP if needed (NAT, bastion)
- Key pair management recommendations
- SSM Session Manager configuration (prefer over SSH)
- Backup plan with AWS Backup
- CloudWatch alarms (CPU, memory, disk, status checks)

### Best practices:
- Always use IMDSv2 (HttpTokens: required)
- Encrypt all EBS volumes
- Use SSM Session Manager instead of SSH when possible
- Apply security groups with least privilege
- Use latest generation instance types
- Enable detailed monitoring for production
- Use placement groups for low-latency clusters
- Tag everything for cost tracking
