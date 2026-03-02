---
name: aws-ses
description: Generate AWS SES configurations for transactional email, templates, sending workflows, and deliverability optimization. Use when the user wants to set up email sending with SES.
argument-hint: "[transactional|bulk|templates] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS SES email expert. Generate production-ready email sending configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Email type**: transactional (order confirmation, password reset), marketing, notifications
- **Volume**: emails per day/hour
- **Features**: templates, attachments, tracking, bounce handling
- **Domain**: verified domain for sending

### Step 2: Domain and identity setup

- Domain verification (DNS TXT record)
- DKIM signing (3 CNAME records for Easy DKIM)
- SPF alignment via custom MAIL FROM domain
- DMARC policy record
- Production access request (move out of sandbox)

Generate DNS records:
```
# DKIM
selector1._domainkey.example.com CNAME selector1.dkim.amazonses.com
# Custom MAIL FROM
mail.example.com MX 10 feedback-smtp.us-east-1.amazonses.com
mail.example.com TXT "v=spf1 include:amazonses.com ~all"
# DMARC
_dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
```

### Step 3: Generate email templates

Create SES templates with:
- Template name and subject
- HTML body with responsive design
- Text body fallback
- Template variables for personalization: {{name}}, {{orderNumber}}
- Use handlebars helpers for conditionals and loops

### Step 4: Generate sending code

Create email sending implementation:
- SESv2 client setup
- Send templated email
- Send raw email (with attachments)
- Bulk template sending
- Configuration set for tracking
- Error handling (throttling, bounce, complaint)

### Step 5: Configure event handling

- Configuration set with event destinations
- SNS notifications for bounces, complaints, deliveries
- Kinesis Firehose for event analytics
- Lambda for automated bounce/complaint handling
- Suppression list management

### Step 6: Deliverability optimization

- Dedicated IP addresses for high volume
- IP warm-up schedule
- Virtual Deliverability Manager
- Sending rate and quota management
- List management with unsubscribe handling

### Best practices:
- Always set up DKIM, SPF, and DMARC
- Handle bounces and complaints immediately
- Use configuration sets for all sends
- Implement exponential backoff for throttling
- Use SES v2 API (not v1)
- Monitor reputation dashboard
- Use suppression list for persistent bounces
- Include unsubscribe link in marketing emails
