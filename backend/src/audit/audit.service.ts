import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    const entry = this.auditRepo.create(params);
    return this.auditRepo.save(entry);
  }

  async findAll(limit = 100) {
    return this.auditRepo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
