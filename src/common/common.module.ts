import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from './common.constants';

@Global()
@Module({
    providers: [
        {
            // common 모듈 생성 시, PubSub을 생성하여 모든 곳에서 사용할 수 있도록 함
            provide: PUB_SUB,
            useValue: new PubSub(),
        },
    ],
    exports: [PUB_SUB],
})
export class CommonModule {}
