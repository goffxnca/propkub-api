import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvincesModule } from './provinces/provinces.module';
import { DistrictsModule } from './districts/districts.module';
import { SubDistrictsModule } from './subDistricts/subDistricts.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostActionsModule } from './postActions/postActions.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    ProvincesModule,
    DistrictsModule,
    SubDistrictsModule,
    PostsModule,
    PostActionsModule,
    AdminModule,
  ],
})
export class AppModule {}
