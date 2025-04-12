import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { SubDistrictsController } from '../../src/subDistricts/subDistricts.controller';
import { SubDistrict } from '../../src/subDistricts/subDistricts.schema';
import { SubDistrictsService } from '../../src/subDistricts/subDistricts.service';

describe('SubDistricts (e2e)', () => {
  let app: INestApplication;
  let service: SubDistrictsService;

  const mockSubDistricts: SubDistrict[] = [
    { id: '1', name: 'Grand Palace', districtId: '1' },
    { id: '2', name: 'Wang Burapha', districtId: '1' },
    { id: '3', name: 'Wat Ratchabophit', districtId: '1' },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SubDistrictsController],
      providers: [
        {
          provide: SubDistrictsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockSubDistricts),
            findOne: jest.fn().mockImplementation((id) => {
              const subDistrict = mockSubDistricts.find(s => s.id === id);
              return Promise.resolve(subDistrict || null);
            }),
            findByDistrictId: jest.fn().mockImplementation((districtId) => {
              return Promise.resolve(mockSubDistricts.filter(s => s.districtId === districtId));
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    service = moduleFixture.get<SubDistrictsService>(SubDistrictsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /subdistricts', () => {
    it('should return an array of subdistricts', () => {
      return request(app.getHttpServer())
        .get('/subdistricts')
        .expect(200)
        .expect(mockSubDistricts);
    });
  });

  describe('GET /subdistricts/:id', () => {
    it('should return a subdistrict when found', () => {
      return request(app.getHttpServer())
        .get('/subdistricts/1')
        .expect(200)
        .expect(mockSubDistricts[0]);
    });

    it('should return 404 when subdistrict is not found', () => {
      return request(app.getHttpServer())
        .get('/subdistricts/999')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'SubDistrict with ID 999 not found',
          error: 'Not Found'
        });
    });
  });

  describe('GET /subdistricts/district/:districtId', () => {
    it('should return subdistricts for a district', () => {
      const district1SubDistricts = mockSubDistricts.filter(s => s.districtId === '1');
      return request(app.getHttpServer())
        .get('/subdistricts/district/1')
        .expect(200)
        .expect(district1SubDistricts)
        .expect((res) => {
          expect(res.body.length).toBe(3);
          expect(res.body.every(s => s.districtId === '1')).toBe(true);
        });
    });

    it('should return empty array for non-existent district', () => {
      return request(app.getHttpServer())
        .get('/subdistricts/district/999')
        .expect(200)
        .expect([]);
    });
  });
}); 