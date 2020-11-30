import { Injectable, coreInjectorFactory, Optional, Inject } from './index';

export class Demo3 { }

@Injectable()
export class Demo2 {
    constructor(private demo3: Demo3) { }
}

@Injectable()
export class Demo {
    /**
     * 先解析Inject后解析Optional
     */
    constructor(@Optional() @Inject(Demo2) private demo2: Demo2) {

    }
}

const injector = coreInjectorFactory([
    {
        provide: Demo, useClass: Demo, multi: true
    },
    {
        provide: Demo2, useClass: Demo2, deps: [
            [new Optional(), Demo3]
        ]
    },
    Demo3
])
const instance = injector.get(Demo)

const inject = new Inject(Demo2)

debugger;