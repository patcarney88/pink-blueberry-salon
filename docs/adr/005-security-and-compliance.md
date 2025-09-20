# ADR-005: Security Architecture and Compliance Framework

## Status
Accepted

## Context
Pink Blueberry Salon handles sensitive customer data including personal information, payment details, and health-related preferences. The system must comply with multiple regulatory frameworks (GDPR, HIPAA, PCI DSS) while maintaining security best practices and user privacy.

## Decision
We will implement a comprehensive security architecture with defense-in-depth principles and built-in compliance features:

### Security Architecture Layers
1. **Edge Security**: CDN-level protection and DDoS mitigation
2. **Application Security**: Input validation, authentication, authorization
3. **Data Security**: Encryption, tokenization, data masking
4. **Infrastructure Security**: Network isolation, access controls
5. **Operational Security**: Monitoring, incident response, auditing

### Compliance Framework
- **GDPR**: Data protection and privacy rights
- **HIPAA**: Healthcare information security (for wellness features)
- **PCI DSS**: Payment card data protection
- **SOC 2**: Service organization controls
- **ISO 27001**: Information security management

## Authentication and Authorization

### Multi-Factor Authentication
```typescript
interface AuthenticationFlow {
  // Primary authentication
  password: {
    minLength: 12;
    complexity: 'high';
    rotation: '90 days';
    history: 12;
  };

  // Second factor options
  mfa: {
    totp: boolean;           // Time-based OTP
    sms: boolean;            // SMS verification
    email: boolean;          // Email verification
    biometric: boolean;      // Biometric authentication
  };

  // Risk-based authentication
  riskFactors: {
    location: boolean;       // Geographic anomalies
    device: boolean;         // Unknown devices
    behavior: boolean;       // Behavioral patterns
    velocity: boolean;       // Login frequency
  };
}
```

### Zero Trust Architecture
```typescript
class ZeroTrustValidator {
  async validateAccess(request: AccessRequest): Promise<AccessDecision> {
    const validations = await Promise.all([
      this.validateIdentity(request.user),
      this.validateDevice(request.device),
      this.validateNetwork(request.network),
      this.validateResource(request.resource),
      this.validateContext(request.context)
    ]);

    return this.makeDecision(validations);
  }

  private async validateIdentity(user: User): Promise<ValidationResult> {
    return {
      authenticated: await this.verifyToken(user.token),
      authorized: await this.checkPermissions(user.permissions),
      riskScore: await this.calculateRiskScore(user)
    };
  }
}
```

### Role-Based Access Control (RBAC)
```typescript
interface SecurityRoles {
  super_admin: {
    permissions: ['*'];
    mfaRequired: true;
    sessionTimeout: '30m';
    ipRestriction: true;
  };

  tenant_admin: {
    permissions: ['tenant:*'];
    mfaRequired: true;
    sessionTimeout: '2h';
    dataAccess: 'tenant-scoped';
  };

  salon_manager: {
    permissions: ['salon:*', 'booking:*', 'staff:*', 'inventory:*'];
    mfaRequired: false;
    sessionTimeout: '8h';
    dataAccess: 'salon-scoped';
  };

  staff: {
    permissions: ['booking:read', 'booking:create', 'customer:read'];
    mfaRequired: false;
    sessionTimeout: '12h';
    dataAccess: 'branch-scoped';
  };

  customer: {
    permissions: ['booking:own', 'profile:own'];
    mfaRequired: false;
    sessionTimeout: '24h';
    dataAccess: 'self-only';
  };
}
```

## Data Protection and Encryption

### Encryption Strategy
```typescript
interface EncryptionLayers {
  // Data at rest
  database: {
    method: 'AES-256-GCM';
    keyRotation: '90 days';
    backupEncryption: true;
  };

  // Data in transit
  transport: {
    tls: 'TLS 1.3 minimum';
    hsts: true;
    certificatePinning: true;
  };

  // Field-level encryption
  sensitive: {
    fields: ['ssn', 'medical_info', 'payment_methods'];
    algorithm: 'AES-256-GCM';
    keyDerivation: 'PBKDF2';
    iterations: 100000;
  };
}

class FieldEncryption {
  async encrypt(data: string, context: EncryptionContext): Promise<EncryptedData> {
    const key = await this.deriveKey(context.masterKey, context.salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: context.salt.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex')
    };
  }
}
```

### Data Tokenization
```typescript
class TokenizationService {
  // PCI DSS compliant payment tokenization
  async tokenizePaymentMethod(cardData: CardData): Promise<PaymentToken> {
    // Never store actual card data
    const token = await this.vault.store(cardData);

    return {
      token,
      last4: cardData.number.slice(-4),
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      cardType: this.detectCardType(cardData.number)
    };
  }

  // Detokenize for payment processing
  async detokenize(token: string): Promise<CardData> {
    return this.vault.retrieve(token);
  }
}
```

### Data Masking and Anonymization
```typescript
class DataMasking {
  maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  }

  maskPhone(phone: string): string {
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  maskCreditCard(cardNumber: string): string {
    return '*'.repeat(12) + cardNumber.slice(-4);
  }

  anonymizeCustomerData(customer: Customer): AnonymizedCustomer {
    return {
      id: this.generateAnonymousId(customer.id),
      ageGroup: this.getAgeGroup(customer.dateOfBirth),
      location: this.generalizeLocation(customer.address),
      preferences: customer.preferences,
      // Remove all PII
      name: undefined,
      email: undefined,
      phone: undefined,
      address: undefined
    };
  }
}
```

## Compliance Implementation

### GDPR Compliance
```typescript
class GDPRCompliance {
  // Right to be informed
  async getDataProcessingInfo(): Promise<DataProcessingInfo> {
    return {
      purposes: ['service_delivery', 'analytics', 'marketing'],
      legalBasis: 'contract',
      retention: '7 years',
      recipients: ['payment_processors', 'email_providers'],
      transfers: 'adequacy_decision',
      rights: ['access', 'rectification', 'erasure', 'portability']
    };
  }

  // Right of access
  async exportUserData(userId: string): Promise<UserDataExport> {
    const [profile, bookings, payments, communications] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserBookings(userId),
      this.getUserPayments(userId),
      this.getUserCommunications(userId)
    ]);

    return {
      personal: this.sanitizePersonalData(profile),
      activity: { bookings, payments },
      communications,
      metadata: {
        exportDate: new Date(),
        format: 'json',
        version: '1.0'
      }
    };
  }

  // Right to erasure (right to be forgotten)
  async deleteUserData(userId: string, reason: string): Promise<void> {
    await this.runDataDeletion([
      // Anonymize instead of delete for legal/business reasons
      () => this.anonymizeUserProfile(userId),
      () => this.anonymizeBookingHistory(userId),
      () => this.deleteCommunicationHistory(userId),
      () => this.removeMarketingConsent(userId),
      // Keep financial records for legal compliance
      () => this.markPaymentRecordsAsDeleted(userId)
    ]);

    await this.auditLog.record({
      action: 'data_deletion',
      userId,
      reason,
      timestamp: new Date(),
      scope: 'complete'
    });
  }
}
```

### HIPAA Compliance (for wellness features)
```typescript
class HIPAACompliance {
  // Minimum necessary standard
  async accessHealthInfo(
    requesterId: string,
    patientId: string,
    purpose: string
  ): Promise<HealthInfoAccess> {
    const authorization = await this.checkAuthorization(requesterId, patientId);
    if (!authorization.allowed) {
      throw new SecurityError('Unauthorized access to health information');
    }

    // Return only minimum necessary information
    return this.filterHealthInfo(
      await this.getHealthInfo(patientId),
      purpose,
      authorization.scope
    );
  }

  // Audit logging for HIPAA
  async logHealthInfoAccess(access: HealthInfoAccess): Promise<void> {
    await this.auditLog.record({
      type: 'health_info_access',
      userId: access.requesterId,
      patientId: access.patientId,
      dataElements: access.dataAccessed,
      purpose: access.purpose,
      timestamp: new Date(),
      ipAddress: access.ipAddress,
      userAgent: access.userAgent
    });
  }
}
```

### PCI DSS Compliance
```typescript
class PCICompliance {
  // Requirement 1: Install and maintain a firewall
  async validateNetworkSecurity(): Promise<SecurityValidation> {
    return {
      firewallConfigured: await this.checkFirewallRules(),
      segmentationValid: await this.validateNetworkSegmentation(),
      trustedNetworks: await this.validateTrustedNetworks()
    };
  }

  // Requirement 3: Protect stored cardholder data
  async protectCardholderData(cardData: CardData): Promise<ProtectedCardData> {
    // Never store sensitive authentication data
    if (this.containsSensitiveData(cardData)) {
      throw new SecurityError('Sensitive authentication data cannot be stored');
    }

    // Tokenize card data
    const token = await this.tokenizationService.tokenize(cardData);

    return {
      token,
      maskedPan: this.maskPan(cardData.pan),
      expiryDate: cardData.expiryDate // Allowed to store
    };
  }

  // Requirement 4: Encrypt transmission of cardholder data
  async transmitCardData(data: CardData, endpoint: string): Promise<void> {
    if (!this.isSecureEndpoint(endpoint)) {
      throw new SecurityError('Card data can only be transmitted to secure endpoints');
    }

    await this.sendEncrypted(data, endpoint, {
      encryption: 'TLS 1.3',
      validation: 'certificate_pinning'
    });
  }
}
```

## Security Monitoring and Incident Response

### Security Information and Event Management (SIEM)
```typescript
class SecurityMonitoring {
  // Real-time threat detection
  async detectThreats(events: SecurityEvent[]): Promise<ThreatAlert[]> {
    const patterns = [
      this.detectBruteForce(events),
      this.detectAnomalousAccess(events),
      this.detectDataExfiltration(events),
      this.detectPrivilegeEscalation(events),
      this.detectSQLInjection(events)
    ];

    const threats = await Promise.all(patterns);
    return threats.flat().filter(threat => threat.severity >= 'medium');
  }

  // Behavioral analysis
  async analyzeUserBehavior(userId: string, actions: UserAction[]): Promise<RiskScore> {
    const baseline = await this.getUserBaseline(userId);
    const deviations = this.calculateDeviations(actions, baseline);

    return {
      score: this.calculateRiskScore(deviations),
      factors: deviations,
      recommendation: this.getRecommendation(deviations)
    };
  }
}
```

### Incident Response
```typescript
class IncidentResponse {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // Immediate containment
    await this.containThreat(incident);

    // Evidence preservation
    await this.preserveEvidence(incident);

    // Notification
    await this.notifyStakeholders(incident);

    // Investigation
    const investigation = await this.investigate(incident);

    // Recovery
    await this.recoverFromIncident(incident, investigation);

    // Lessons learned
    await this.documentLessonsLearned(incident, investigation);
  }

  private async containThreat(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'data_breach':
        await this.isolateAffectedSystems(incident.affectedSystems);
        await this.revokeCompromisedCredentials(incident.compromisedAccounts);
        break;
      case 'ddos_attack':
        await this.enableDDoSProtection();
        await this.blockMaliciousIPs(incident.attackerIPs);
        break;
      case 'malware':
        await this.quarantineInfectedSystems(incident.affectedSystems);
        await this.runMalwareScan();
        break;
    }
  }
}
```

## Privacy by Design

### Data Minimization
```typescript
class DataMinimization {
  // Collect only necessary data
  async collectUserData(purpose: string, requestedData: any): Promise<any> {
    const necessaryFields = this.getNecessaryFields(purpose);
    const filteredData = this.filterData(requestedData, necessaryFields);

    await this.auditLog.record({
      action: 'data_collection',
      purpose,
      fieldsCollected: Object.keys(filteredData),
      fieldsRejected: this.getRejectedFields(requestedData, filteredData)
    });

    return filteredData;
  }

  // Automatic data purging
  async purgeUnnecessaryData(): Promise<void> {
    const retentionPolicies = await this.getRetentionPolicies();

    for (const policy of retentionPolicies) {
      const expiredData = await this.findExpiredData(policy);
      await this.purgeData(expiredData);
    }
  }
}
```

### Consent Management
```typescript
class ConsentManagement {
  async recordConsent(consent: ConsentRecord): Promise<void> {
    await this.consentStore.save({
      userId: consent.userId,
      purposes: consent.purposes,
      timestamp: new Date(),
      method: consent.method, // 'explicit', 'implicit', 'opt-out'
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      version: consent.privacyPolicyVersion
    });
  }

  async withdrawConsent(userId: string, purposes: string[]): Promise<void> {
    await this.consentStore.withdraw(userId, purposes);
    await this.stopProcessing(userId, purposes);
    await this.notifyDataProcessors(userId, purposes);
  }

  async checkConsentValidity(userId: string, purpose: string): Promise<boolean> {
    const consent = await this.getConsent(userId, purpose);

    return consent &&
           !consent.withdrawn &&
           this.isConsentFresh(consent) &&
           this.isConsentSpecific(consent, purpose);
  }
}
```

## Vulnerability Management

### Security Testing
```typescript
class SecurityTesting {
  // Automated security scanning
  async runSecurityScan(): Promise<SecurityScanResults> {
    const results = await Promise.all([
      this.runSASTScan(), // Static Analysis Security Testing
      this.runDASTScan(), // Dynamic Analysis Security Testing
      this.runDependencyScan(),
      this.runContainerScan(),
      this.runInfrastructureScan()
    ]);

    return this.aggregateResults(results);
  }

  // Penetration testing coordination
  async schedulePenetrationTest(): Promise<PenTestPlan> {
    return {
      scope: this.definePenTestScope(),
      methodology: 'OWASP Testing Guide',
      schedule: this.getNextPenTestWindow(),
      objectives: this.getPenTestObjectives(),
      constraints: this.getPenTestConstraints()
    };
  }
}
```

## Consequences

### Positive
- **Comprehensive Protection**: Defense-in-depth security model
- **Regulatory Compliance**: Built-in compliance with major frameworks
- **Privacy Protection**: Strong privacy controls and user rights
- **Threat Detection**: Real-time security monitoring and response
- **Data Protection**: Multiple layers of data security
- **Incident Response**: Structured approach to security incidents

### Negative
- **Implementation Complexity**: Significant development overhead
- **Performance Impact**: Security checks add latency
- **Operational Overhead**: Continuous security monitoring and maintenance
- **Compliance Costs**: Regular audits and certifications required
- **User Experience**: Additional security steps may impact UX
- **Technology Constraints**: Security requirements limit technology choices

## Testing and Validation
- **Security Unit Tests**: Test security functions in isolation
- **Integration Security Tests**: End-to-end security flow validation
- **Penetration Testing**: Regular external security assessments
- **Compliance Audits**: Third-party compliance validation
- **Red Team Exercises**: Simulated attack scenarios
- **User Acceptance Testing**: Security feature usability validation

## Continuous Improvement
- **Threat Intelligence**: Stay updated with emerging threats
- **Security Metrics**: Track security KPIs and trends
- **Feedback Loop**: Incorporate lessons learned from incidents
- **Technology Updates**: Regular updates to security tools and practices
- **Training Programs**: Ongoing security awareness training
- **Industry Collaboration**: Participate in security communities