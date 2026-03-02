# AWS SES

Generate SES email configurations with templates, domain verification, sending authorization, and deliverability optimization.

## Usage

```bash
/aws-ses <description of your email requirements>
```

## What It Does

1. Configures domain and email identity verification with DNS records
2. Generates email templates with HTML and text versions using Handlebars
3. Creates sending authorization policies for cross-account sending
4. Sets up configuration sets with event destinations for tracking
5. Produces application code for sending templated and raw emails
6. Adds DKIM, SPF, DMARC records and suppression list management

## Examples

```bash
/aws-ses Set up domain verification with DKIM and DMARC for transactional email

/aws-ses Create email templates for welcome, password reset, and order confirmation

/aws-ses Build a Node.js email service with SES v2 API and bounce handling
```

## Allowed Tools

- `Read` - Read existing email templates and sending configurations
- `Write` - Create email templates, DNS records, and sending code
- `Edit` - Modify existing SES configurations
- `Bash` - Run AWS CLI SES commands for testing
- `Glob` - Search for email template files
- `Grep` - Find email sending references in application code
