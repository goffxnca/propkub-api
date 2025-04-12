import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { DistrictsController } from '../../src/districts/districts.controller';
import { District } from '../../src/districts/districts.schema';
import { DistrictsService } from '../../src/districts/districts.service';

describe('Districts (e2e)', () => {
  let app: INestApplication;
  let service: DistrictsService;

  const mockDistricts: District[] = [
    { id: '1', name: 'Bang Rak', provinceId: '1' },
    { id: '2', name: 'Pathum Wan', provinceId: '1' },
    { id: '3', name: 'Mueang Chiang Mai', provinceId: '2' },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DistrictsController],
      providers: [
        {
          provide: DistrictsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockDistricts),
            findOne: jest.fn().mockImplementation((id) => {
              const district = mockDistricts.find(d => d.id === id);
              return Promise.resolve(district || null);
            }),
            findByProvinceId: jest.fn().mockImplementation((provinceId) => {
              return Promise.resolve(mockDistricts.filter(d => d.provinceId === provinceId));
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    service = moduleFixture.get<DistrictsService>(DistrictsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /districts', () => {
    it('should return an array of districts', () => {
      return request(app.getHttpServer())
        .get('/districts')
        .expect(200)
        .expect(mockDistricts);
    });
  });

  describe('GET /districts/:id', () => {
    it('should return a district when found', () => {
      return request(app.getHttpServer())
        .get('/districts/1')
        .expect(200)
        .expect(mockDistricts[0]);
    });

    it('should return 404 when district is not found', () => {
      return request(app.getHttpServer())
        .get('/districts/999')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'District with ID 999 not found',
          error: 'Not Found'
        });
    });
  });

  describe('GET /districts/province/:provinceId', () => {
    it('should return districts for a province', () => {
      const province1Districts = mockDistricts.filter(d => d.provinceId === '1');
      return request(app.getHttpServer())
        .get('/districts/province/1')
        .expect(200)
        .expect(province1Districts)
        .expect((res) => {
          expect(res.body.length).toBe(2); 
          expect(res.body.every(d => d.provinceId === '1')).toBe(true);
        });
    });

    it('should return empty array for non-existent province', () => {
      return request(app.getHttpServer())
        .get('/districts/province/999')
        .expect(200)
        .expect([]);
    });
  });
}); 