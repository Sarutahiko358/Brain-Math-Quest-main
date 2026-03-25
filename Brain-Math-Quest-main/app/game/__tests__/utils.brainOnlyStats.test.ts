/**
 * Tests for Brain-only statistics utility functions
 */

import { describe, it, expect } from 'vitest';
import { pickFastestAndSlowest, summarizeByType } from '../utils';
import { BrainOnlyRecord } from '../types';

describe('pickFastestAndSlowest', () => {
  it('should return null for empty array', () => {
    const result = pickFastestAndSlowest([]);
    expect(result).toBeNull();
  });

  it('should return same record for single item', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 5.5, type: 'SUM' },
    ];
    
    const result = pickFastestAndSlowest(records);
    
    expect(result).not.toBeNull();
    expect(result!.fastest).toEqual(records[0]);
    expect(result!.slowest).toEqual(records[0]);
  });

  it('should find fastest and slowest in multiple records', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 5.5, type: 'SUM' },
      { ok: false, time: 2.3, type: 'COMPARE' },
      { ok: true, time: 8.7, type: 'MISSING' },
      { ok: true, time: 3.1, type: 'SUM' },
    ];
    
    const result = pickFastestAndSlowest(records);
    
    expect(result).not.toBeNull();
    expect(result!.fastest.time).toBe(2.3);
    expect(result!.fastest.ok).toBe(false);
    expect(result!.slowest.time).toBe(8.7);
    expect(result!.slowest.ok).toBe(true);
  });

  it('should handle tie by returning first occurrence (stable sort)', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 5.0, type: 'SUM' },
      { ok: false, time: 5.0, type: 'COMPARE' },
      { ok: true, time: 5.0, type: 'MISSING' },
    ];
    
    const result = pickFastestAndSlowest(records);
    
    expect(result).not.toBeNull();
    // All have same time, first should be both fastest and slowest
    expect(result!.fastest.type).toBe('SUM');
    expect(result!.slowest.type).toBe('SUM');
  });

  it('should not mutate original array', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 5.5, type: 'SUM' },
      { ok: false, time: 2.3, type: 'COMPARE' },
      { ok: true, time: 8.7, type: 'MISSING' },
    ];
    
    const originalOrder = [...records];
    pickFastestAndSlowest(records);
    
    expect(records).toEqual(originalOrder);
  });

  it('should handle records without type field', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 5.5 },
      { ok: false, time: 2.3 },
    ];
    
    const result = pickFastestAndSlowest(records);
    
    expect(result).not.toBeNull();
    expect(result!.fastest.time).toBe(2.3);
    expect(result!.slowest.time).toBe(5.5);
  });

  it('should handle very close time values', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 5.001, type: 'SUM' },
      { ok: true, time: 5.002, type: 'COMPARE' },
      { ok: true, time: 5.000, type: 'MISSING' },
    ];
    
    const result = pickFastestAndSlowest(records);
    
    expect(result).not.toBeNull();
    expect(result!.fastest.time).toBe(5.000);
    expect(result!.slowest.time).toBe(5.002);
  });
});

describe('summarizeByType', () => {
  it('should return empty array for empty input', () => {
    const result = summarizeByType([]);
    expect(result).toEqual([]);
  });

  it('should summarize single type', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.5, type: 'SUM' },
      { ok: true, time: 4.2, type: 'SUM' },
      { ok: false, time: 5.0, type: 'SUM' },
    ];
    
    const result = summarizeByType(records);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('SUM');
    expect(result[0].count).toBe(3);
    expect(result[0].correct).toBe(2);
    expect(result[0].avgTime).toBeCloseTo((3.5 + 4.2 + 5.0) / 3, 2);
    expect(result[0].rate).toBe(67); // Math.round(2/3 * 100)
  });

  it('should summarize multiple types', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.0, type: 'SUM' },
      { ok: true, time: 4.0, type: 'SUM' },
      { ok: false, time: 5.0, type: 'COMPARE' },
      { ok: true, time: 6.0, type: 'COMPARE' },
      { ok: true, time: 7.0, type: 'MISSING' },
    ];
    
    const result = summarizeByType(records);
    
    expect(result).toHaveLength(3);
    
    const sumStats = result.find(s => s.type === 'SUM')!;
    expect(sumStats.count).toBe(2);
    expect(sumStats.correct).toBe(2);
    expect(sumStats.rate).toBe(100);
    expect(sumStats.avgTime).toBe(3.5);
    
    const compareStats = result.find(s => s.type === 'COMPARE')!;
    expect(compareStats.count).toBe(2);
    expect(compareStats.correct).toBe(1);
    expect(compareStats.rate).toBe(50);
    expect(compareStats.avgTime).toBe(5.5);
    
    const missingStats = result.find(s => s.type === 'MISSING')!;
    expect(missingStats.count).toBe(1);
    expect(missingStats.correct).toBe(1);
    expect(missingStats.rate).toBe(100);
    expect(missingStats.avgTime).toBe(7.0);
  });

  it('should handle records without type field', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.0 },
      { ok: false, time: 4.0 },
    ];
    
    const result = summarizeByType(records);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('-');
    expect(result[0].count).toBe(2);
    expect(result[0].correct).toBe(1);
    expect(result[0].rate).toBe(50);
  });

  it('should handle mixed records with and without type', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.0, type: 'SUM' },
      { ok: true, time: 4.0 },
      { ok: false, time: 5.0 },
    ];
    
    const result = summarizeByType(records);
    
    expect(result).toHaveLength(2);
    expect(result.find(s => s.type === 'SUM')?.count).toBe(1);
    expect(result.find(s => s.type === '-')?.count).toBe(2);
  });

  it('should calculate 0% rate for all failures', () => {
    const records: BrainOnlyRecord[] = [
      { ok: false, time: 3.0, type: 'SUM' },
      { ok: false, time: 4.0, type: 'SUM' },
    ];
    
    const result = summarizeByType(records);
    
    expect(result[0].rate).toBe(0);
    expect(result[0].correct).toBe(0);
  });

  it('should calculate 100% rate for all successes', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.0, type: 'SUM' },
      { ok: true, time: 4.0, type: 'SUM' },
    ];
    
    const result = summarizeByType(records);
    
    expect(result[0].rate).toBe(100);
    expect(result[0].correct).toBe(2);
  });

  it('should round rate correctly', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.0, type: 'SUM' },
      { ok: false, time: 4.0, type: 'SUM' },
      { ok: false, time: 5.0, type: 'SUM' },
    ];
    
    const result = summarizeByType(records);
    
    // 1/3 = 0.333... => Math.round(33.333...) = 33
    expect(result[0].rate).toBe(33);
  });

  it('should not mutate original array', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 3.0, type: 'SUM' },
      { ok: false, time: 4.0, type: 'COMPARE' },
    ];
    
    const originalRecords = JSON.parse(JSON.stringify(records));
    summarizeByType(records);
    
    expect(records).toEqual(originalRecords);
  });

  it('should handle many types', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 1.0, type: 'SUM' },
      { ok: true, time: 2.0, type: 'COMPARE' },
      { ok: true, time: 3.0, type: 'MISSING' },
      { ok: true, time: 4.0, type: 'PAIR' },
      { ok: true, time: 5.0, type: 'ORDER' },
      { ok: true, time: 6.0, type: 'MAX_MIN' },
    ];
    
    const result = summarizeByType(records);
    
    expect(result).toHaveLength(6);
    result.forEach(stat => {
      expect(stat.count).toBe(1);
      expect(stat.correct).toBe(1);
      expect(stat.rate).toBe(100);
    });
  });

  it('should calculate correct average with decimal precision', () => {
    const records: BrainOnlyRecord[] = [
      { ok: true, time: 1.11, type: 'SUM' },
      { ok: true, time: 2.22, type: 'SUM' },
      { ok: true, time: 3.33, type: 'SUM' },
    ];
    
    const result = summarizeByType(records);
    
    expect(result[0].avgTime).toBeCloseTo((1.11 + 2.22 + 3.33) / 3, 5);
  });
});
