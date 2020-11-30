export interface OnInit {
    onInit(): void | Promise<void>;
}
export interface OnDestory {
    onDestory(): void | Promise<void>;
}
export interface OnError {
    onError(): void | Promise<void>;
}
export interface OnRequest {
    onRequest(): void | Promise<void>;
}
export interface OnResponse {
    onRespones(): void | Promise<void>;
}
