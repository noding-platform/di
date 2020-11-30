import {
    ConstructorProvider, isConstructorProvider, Injector, isType, isUseClass,
    isUseExisting, isUseFactory, isUseValue, ParameterHandler, Provider, Record, Type,
    UseClass, UseExisting, UseFactory, UseValue, StringType, InjectableParameterHandler, Dependency, Token,
    DependencyOperation, OptionFlags
} from './types';
import { getDecorator, IParameterDecorator } from '@noding/decorator'
import { StaticInjector } from './injector';
import { isInject, isOptional, isSelf, isSkipSelf, InjectDef } from './decorator';

function createMulti<T>(_current: Record<T>, _pre?: Record<T>): any {
    const current = _current.create();
    if (_pre) {
        const pre = _pre.create() as any;
        return [...pre, current]
    } else {
        return [current]
    }
}

function getRecordHandler<T>(it: any, record: Record<any> | undefined, _record: Map<any, any>, injector: Injector) {
    return (createMultiRecord: any, createRecord: any) => {
        if (record) {
            if (it.multi) {
                // multi
                record.setRecord(createMultiRecord(it, injector, record))
            } else {
                record.setRecord(createRecord(it, injector))
            }
        } else {
            if (it.multi) {
                _record.set(it.provide, createMultiRecord(it, injector, record))
            } else {
                _record.set(it.provide, createRecord(it, injector))
            }
        }
    }
}

export function createProviderRecord(it: Provider, injector: StaticInjector) {
    const _record = injector._record;
    if (isType(it)) {
        _record.set(it, createTypeRecord(it, injector))
    } else if (Array.isArray(it)) {
        it.map(i => createProviderRecord(i, injector))
    } else {
        const record = injector.getRecord(it.provide);
        const handler = getRecordHandler(it, record, _record, injector)
        if (isUseValue(it)) {
            handler(createMultiUseValueRecord, createUseValueRecord)
        } else if (isUseClass(it)) {
            handler(createMultiUseClassRecord, createUseClassRecord)
        } else if (isUseFactory(it)) {
            handler(createMultiUseFactoryRecord, createUseFactoryRecord)
        } else if (isUseExisting(it)) {
            handler(createMultiUseExistingRecord, createUseExistingRecord)
        } else if (isConstructorProvider(it)) {
            handler(createMultiConstructorRecord, createConstructorRecord)
        } else {
            throw new Error(`unkonw provider`)
        }
    }
}


export function createMultiConstructorRecord<T>(val: ConstructorProvider<T>, injector: Injector, record?: Record<T>): Record<T> {
    return new Record({
        factory: () => {
            const currentRecord = createConstructorRecord(val, injector)
            return createMulti(currentRecord, record);
        }
    })
}

export function createConstructorRecord<T>(val: ConstructorProvider<T>, injector: Injector): Record<T> {
    return new Record({
        factory: () => {
            if (val.deps) {
                const deps = val.deps || [];
                const parameters = deps.map(dep => getInjector(injector, dep));
                return new val.provide(...parameters)
            } else {
                return createTypeRecord(val.provide, injector).create()
            }
        }
    })
}

export function getInjector(injector: Injector, dep: Dependency) {
    if (Array.isArray(dep)) {
        let flags = OptionFlags.Default;
        let token: Token<any> = dep as any;
        dep.forEach((d: DependencyOperation) => {
            if (isOptional(d)) {
                flags = flags | OptionFlags.Optional
            }
            else if (isSkipSelf(d)) {
                flags = flags | OptionFlags.Parent
            }
            else if (isSelf(d)) {
                flags = flags | OptionFlags.Self
            }
            else if (isInject(d)) {
                token = (d as InjectDef).token;
            }
            else {
                token = d;
            }
        });
        return injector.get(token, undefined, flags as any)
    } else {
        return injector.get(dep)
    }
}

export function createUseExistingRecord<T>(val: UseExisting<T>, injector: Injector): Record<T> {
    return new Record({
        factory: () => injector.get(val.useExisting)
    })
}


export function createMultiUseExistingRecord<T>(val: UseExisting<T>, injector: Injector, record?: Record<T>): Record<T> {
    return new Record({
        factory: () => {
            const currentRecord = createUseExistingRecord(val, injector)
            return createMulti(currentRecord, record);
        }
    })
}

export function createUseFactoryRecord<T>(val: UseFactory<T>, injector: Injector): Record<T> {
    return new Record({
        factory: () => {
            const type = val.useFactory;
            const deps = val.deps || [];
            const parameters = deps.map(it => getInjector(injector, it))
            return type(...parameters);
        }
    })
}

export function createMultiUseFactoryRecord<T>(val: UseFactory<T>, injector: Injector, record?: Record<T>): Record<T> {
    return new Record({
        factory: () => {
            const currentRecord = createUseFactoryRecord(val, injector)
            return createMulti(currentRecord, record);
        }
    })
}

export function createUseClassRecord<T>(val: UseClass<T>, injector: Injector): Record<T> {
    if (val.deps) {
        return new Record({
            factory: () => {
                const type = val.useClass;
                const deps = val.deps || [];
                const parameters = deps.map(it => getInjector(injector, it))
                return new type(...parameters);
            }
        })
    } else {
        return createTypeRecord(val.useClass, injector)
    }
}

export function createMultiUseClassRecord<T>(val: UseClass<T>, injector: Injector, record?: Record<T>): Record<T> {
    return new Record({
        factory: () => {
            const currentRecord = createUseClassRecord(val, injector)
            return createMulti(currentRecord, record);
        }
    })
}

export function createUseValueRecord<T>(val: UseValue<T>): Record<T> {
    return new Record({
        value: val.useValue
    })
}
export function createMultiUseValueRecord<T>(val: UseValue<T>, record?: Record<T>): Record<T> {
    return new Record({
        factory: () => {
            const current = createUseValueRecord(val);
            return createMulti(current, record);
        }
    })
}
export function createTypeRecord<T>(type: Type<T>, injector: Injector): Record<T> {
    return new Record({
        factory: () => {
            const decorator = getDecorator(type);
            const constructor = decorator.parameters.constructor;
            if (Object.keys(constructor).length === 0) {
                return new type();
            } else {
                const entities = Object.entries(constructor);
                const res: ArrayLike<any> = {
                    length: entities.length
                };
                entities.map(([index, args]) => {
                    const item = (args as any[]).reverse().reduce((pre: InjectableParameterHandler, next: IParameterDecorator) => {
                        return (injector: Injector, def: any) => {
                            const handlerNext = injector.get(next.name as StringType<ParameterHandler>);
                            return handlerNext(injector, next, pre, def)
                        }
                    }, emptyParameterHandler);
                    Reflect.set(res, index, item(injector, undefined));
                });
                const parameters = Array.from(res);
                return new type(...parameters)
            }
        }
    })
}

export function emptyParameterHandler(injector: Injector, def: any) {
    return def;
}