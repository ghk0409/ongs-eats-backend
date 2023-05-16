import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

@ObjectType()
export class AllCategoriesOutput extends CoreOutput {
    // array 형태의 카테고리 목록 반환
    @Field((type) => [Category], { nullable: true })
    categories?: Category[];
}
