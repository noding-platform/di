import { IParameterDecorator } from "@noding/decorator";

export interface Type<T> extends Function {
    new(...args: any[]): T;
}
export interface AbstractType<T> extends Function {
    prototype: T;
}
export function isType<T>(val: any): val is Type<T> {
    return typeof val === 'function'
}
export abstract class Injector {
    readonly parent: Injector | undefined;
    readonly name: string | undefined;
    abstract get<T>(token: Token<T>, def?: T, flags?: InjectFlags): T;
}
export type StringType<T> = string & { _type?: T }
export type BooleanType<T> = boolean & { _type?: T }
export type NumberType<T> = number & { _type?: T }
export type ObjectType<T> = object & { _type?: T }
export type SymbolType<T> = symbol & { _type?: T }

export class Record<T = any> {
    constructor(private options: {
        factory?: () => T,
        value?: T
    }) { }
    create() {
        let { factory, value } = this.options;
        if (value) return value;
        if (factory) {
            value = factory();
            this.options.value = value;
            return value;
        }
        throw new Error(`record create error`)
    }
    setValue(val: T) {
        this.options.value = val;
    }
    setFactory(factory: () => T) {
        this.options.factory = factory;
    }
    getOptions() {
        return this.options;
    }
    setRecord(record: Record<T>) {
        this.options = record.getOptions();
    }
}

export class InjectionToken<T> {
    type: Type<T>;
    constructor(private _name: string) { }
}

export type Token<T = any> = InjectionToken<T> | Type<T> | AbstractType<T> | StringType<T> | BooleanType<T> | NumberType<T> | ObjectType<T> | SymbolType<T>;

import { OptionalDef, SkipSelfDef, SelfDef, InjectDef } from './decorator'
export type DependencyOperation<T = any> = OptionalDef | SkipSelfDef | SelfDef | InjectDef | Token<T>;
export type Dependency<T = any> = Token<T> | DependencyOperation[];

export interface BaseProvider<T> {
    provide: Token<T>;
    multi?: boolean;
}
export interface UseValue<T> extends BaseProvider<T> {
    useValue: T;
}
export function isUseValue<T>(val: any): val is UseValue<T> {
    return val && Reflect.has(val, 'useValue')
}

export interface UseClass<T> extends BaseProvider<T> {
    useClass: Type<T>;
    deps?: Dependency[];
}

export function isUseClass<T>(val: any): val is UseClass<T> {
    return val && Reflect.has(val, 'useClass')
}

export interface UseFactory<T> extends BaseProvider<T> {
    useFactory: (...args: any[]) => T;
    deps?: Dependency[];
}

export function isUseFactory<T>(val: any): val is UseFactory<T> {
    return val && Reflect.has(val, 'useFactory')
}

export interface UseExisting<T> extends BaseProvider<T> {
    useExisting: Token<T>;
}

export function isUseExisting<T>(val: any): val is UseExisting<T> {
    return val && Reflect.has(val, 'useExisting')
}

export interface ConstructorProvider<T> {
    provide: Type<T>;
    multi?: boolean;
    deps?: Dependency[];
}

export function isConstructorProvider<T>(val: any): val is ConstructorProvider<T> {
    return val && isType(val.provide)
}

export type Provider<T = any> = Type<T> | UseValue<T> | UseClass<T> | UseFactory<T> | UseExisting<T> | ConstructorProvider<T> | Provider<T>[];

export interface ParameterHandler {
    (injector: Injector, current: IParameterDecorator, next: InjectableParameterHandler | undefined | null, def: any): any;
}
export interface InjectableParameterHandler {
    (injector: Injector, def: any): any;
}
export enum InjectFlags {
    Default = 0,
    // 自己 0001
    Self = 1,
    // 跳过自己 0010
    Parent = 2,
    // 可以为空 0100
    Optional = 4
}

export enum OptionFlags {
    // 自己 0001
    Self = 1 << 0,
    // 跳过自己 0010
    Parent = 1 << 1,
    // 可以为空 0100
    Optional = 1 << 2,
    Default = Self | Parent,
}