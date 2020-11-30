import { Record, Provider, Token, Injector, InjectableParameterHandler, InjectFlags, OptionFlags } from './types'
import { defaultParameterHandlerToken } from './token';
import { createProviderRecord } from './util';
import { IParameterDecorator } from '@noding/decorator';
import { InjectMetadataKey, OptionalMetadataKey, SkipSelfMetadataKey } from './decorator';

export class StaticInjectorNotFoundError extends Error {
    constructor() {
        super(`StaticInjectorNotFoundError`)
    }
}

export class StaticInjectorParentNotFoundError extends Error {
    constructor() {
        super(`StaticInjectorParentNotFoundError`)
    }
}
export class StaticInjector extends Injector {
    _record: Map<Token<any>, Record> = new Map();
    constructor(providers: Provider[], readonly name: string | undefined = undefined, readonly parent: Injector | undefined = undefined) {
        super();
        this.name = name;
        this.parent = parent;
        this._record.set(Injector, new Record({ value: this }))
        providers.map(it => createProviderRecord(it, this));
    }
    get<T>(token: Token<T>, def?: T, flags: InjectFlags = InjectFlags.Default): T {
        let isParent = true;
        let isSelf = true;
        let isOptional = false;
        if (flags !== InjectFlags.Default) {
            isParent = (OptionFlags.Parent & flags) === OptionFlags.Parent;
            isSelf = (OptionFlags.Self & flags) === OptionFlags.Self;
            isOptional = (OptionFlags.Optional & flags) === OptionFlags.Optional;
        }
        if (isSelf) {
            const record = this._record.get(token);
            if (record) {
                return record.create()
            }
        }
        if (this.parent && isParent) {
            return this.parent.get(token, def)
        }
        if (isOptional) {
            return def as T;
        }
        throw new StaticInjectorNotFoundError()
    }

    getRecord<T>(token: Token<T>): Record<T> | undefined {
        if (this._record.has(token)) return this._record.get(token) as Record<T>;
        if (this.parent) {
            return (this.parent as StaticInjector).getRecord(token)
        }
        return undefined;
    }
}

export function createInjector(providers: Provider[], name?: string, parent?: Injector) {
    return new StaticInjector(providers, name, parent)
}
export interface InjectorFactory {
    (providers: Provider[]): Injector;
}
export function createInjectorFactory(parent: InjectorFactory, name: string, providers: Provider[]): InjectorFactory {
    const parentInjector = parent(providers)
    return (all: Provider[]) => {
        return createInjector(all, name, parentInjector)
    }
}

export const topInjectorFactory = (providers: Provider[]) => {
    return createInjector(providers, 'top')
}

export const coreInjectorFactory = createInjectorFactory(topInjectorFactory, 'core', [{
    provide: defaultParameterHandlerToken,
    useValue: (injector: Injector, param: IParameterDecorator, next: InjectableParameterHandler, def: any) => {
        if (def) {
            return next(injector, def)
        }
        const res = injector.get(param.type, def)
        return next(injector, res)
    }
}, {
    provide: OptionalMetadataKey,
    useValue: (injector: Injector, param: IParameterDecorator, next: InjectableParameterHandler, def: any) => {
        try {
            return next && next(injector, def)
        } catch (e) {
            return undefined;
        }
    }
}, {
    provide: SkipSelfMetadataKey,
    useValue: (injector: Injector, param: IParameterDecorator, next: InjectableParameterHandler, def: any) => {
        if (injector.parent) {
            return next(injector.parent, def)
        }
        throw new StaticInjectorParentNotFoundError()
    }
}, {
    provide: InjectMetadataKey,
    useValue: (injector: Injector, param: IParameterDecorator, next: InjectableParameterHandler, def: any) => {
        const [token] = param.args || [param.type];
        const res = injector.get(token);
        return next(injector, res)
    }
}])
