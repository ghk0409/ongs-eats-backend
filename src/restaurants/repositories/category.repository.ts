import { DataSource, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Injectable } from '@nestjs/common';

// 레포지터리 커스텀
@Injectable()
export class CategoryRepository extends Repository<Category> {
    constructor(private dataSource: DataSource) {
        super(Category, dataSource.createEntityManager());
    }

    // 카테고리 생성 또는 반환 메서드
    async getOrCreate(name: string): Promise<Category> {
        // slug 생성 (입력받은 categoryName의 통일성을 위함)
        // 앞 뒤 공백 제거 및 소문자로 변환
        const categoryName = name.trim().toLowerCase();
        // 띄어쓰기를 -로 변환
        const categorySlug = categoryName.replace(/ /g, '-');

        // 해당 slug로 일치하는 카테고리가 있는지 확인
        let category = await this.findOne({
            where: { slug: categorySlug },
        });
        // 없으면 생성
        if (!category) {
            category = await this.save(
                this.create({
                    slug: categorySlug,
                    name: categoryName,
                }),
            );
        }

        return category;
    }
}
