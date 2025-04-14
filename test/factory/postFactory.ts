import {
  Post,
  PostStatus,
  PostSubStatus,
  PostType,
  AssetType,
  AreaUnit,
  TimeUnit,
  Condition,
} from '../../src/posts/posts.schema';
import { faker } from '@faker-js/faker';

const now = new Date();

// Base post template
export const basePost: Post = {
  _id: '1',
  title: 'Luxury Condo in Bangkok',
  slug: 'luxury-condo-bangkok',
  desc: faker.lorem.paragraph(),
  assetType: AssetType.CONDO,
  postType: PostType.SALE,
  price: 5000000,
  priceUnit: AreaUnit.SQM,
  area: 100,
  areaUnit: AreaUnit.SQM,
  status: PostStatus.ACTIVE,
  subStatus: PostSubStatus.CREATED,
  isMember: true,
  isStudio: false,
  thumbnail: faker.image.url(),
  images: [faker.image.url(), faker.image.url()],
  facilities: [
    { id: 'pool', label: 'Swimming Pool' },
    { id: 'gym', label: 'Gym' },
  ],
  specs: [
    { id: '1', label: 'Bedrooms', value: 2 },
    { id: '2', label: 'Bathrooms', value: 2 },
  ],
  address: {
    provinceId: '1',
    provinceLabel: 'Bangkok',
    districtId: '1',
    districtLabel: 'Phra Nakhon',
    subDistrictId: '1',
    subDistrictLabel: 'Phra Borom Maha Ratchawang',
    regionId: '1',
    location: {
      lat: 13.7563,
      lng: 100.5018,
    },
  },
  createdAt: now,
  updatedAt: now,
  postViews: 0,
  phoneViews: 0,
  lineViews: 0,
  cid: 1,
  postNumber: 'P001',
  land: 0,
  landUnit: AreaUnit.SQM,
  condition: Condition.NEW,
  contact: {
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    line: faker.internet.username(),
  },
  createdBy: {
    userId: '1',
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    role: 'agent',
  },
  updatedBy: {
    userId: '1',
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    role: 'agent',
  },
};

export const createPost = (overrides: Partial<Post> = {}): Post => {
  const merged = {
    ...basePost,
    ...overrides,
  };

  // Deep merge for nested objects
  if (overrides.address) {
    merged.address = {
      ...basePost.address,
      ...overrides.address,
    };
  }

  if (overrides.contact) {
    merged.contact = {
      ...basePost.contact,
      ...overrides.contact,
    };
  }

  if (overrides.createdBy) {
    merged.createdBy = {
      ...basePost.createdBy,
      ...overrides.createdBy,
    };
  }

  if (overrides.updatedBy) {
    merged.updatedBy = {
      ...basePost.updatedBy,
      ...overrides.updatedBy,
    };
  }

  return merged;
};
