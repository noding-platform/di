import { createClassDecorator, createParameterDecorator } from '@noding/decorator';
import { ParameterHandler, StringType, Token } from './types';
export const InjectableMetadataKey = `@noding/di InjectableMetadataKey`;
export interface Injectable {
    new(): InjectableDef;
    (): ClassDecorator;
}
export class InjectableDef { }
export const Injectable = createClassDecorator<Injectable>(InjectableMetadataKey, undefined, InjectableDef)
/**
 * 可以为空 
 */
export const OptionalMetadataKey = `@noding/di InjectableMetadataKey` as StringType<ParameterHandler>;
export interface Optional {
    new(): OptionalDef;
    (): ParameterDecorator;
}
export class OptionalDef { }
export function isOptional(val: any): val is OptionalDef {
    return val && val instanceof OptionalDef
}
export const Optional = createParameterDecorator<Optional>(OptionalMetadataKey, undefined, OptionalDef)

export const SkipSelfMetadataKey = `@noding/di SkipSelfMetadataKey` as StringType<ParameterHandler>;
export interface SkipSelf {
    new(): SkipSelfDef;
    (): ParameterDecorator;
}
export class SkipSelfDef { }
export function isSkipSelf(val: any): val is SkipSelfDef {
    return val && val instanceof SkipSelfDef
}
export const SkipSelf = createParameterDecorator<SkipSelf>(SkipSelfMetadataKey, undefined, SkipSelfDef)

export const SelfMetadataKey = `@noding/di SelfMetadataKey` as StringType<ParameterHandler>;
export interface Self {
    new(): SelfDef;
    (): ParameterDecorator;
}
export class SelfDef { }
export function isSelf(val: any): val is SelfDef {
    return val && val instanceof SelfDef
}
export const Self = createParameterDecorator<SkipSelf>(SelfMetadataKey, undefined, SelfDef)

export const InjectMetadataKey = `@noding/di InjectMetadataKey` as StringType<ParameterHandler>;
export interface Inject {
    new(token: Token<any>): InjectDef;
    (token: Token<any>): ParameterDecorator;
}
export class InjectDef<T = any> {
    constructor(public token: Token<T>) { }
}
export function isInject(val: any): val is InjectDef {
    return val && val instanceof InjectDef
}
export const Inject = createParameterDecorator<Inject>(InjectMetadataKey, (token: Token<any>) => {
    return {
        token
    }
}, InjectDef)
