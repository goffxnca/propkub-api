import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from './posts.schema';
import { User, UserSchema } from '../users/users.schema';
import { EnvironmentModule } from '../environments/environment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    EnvironmentModule,
  ],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
