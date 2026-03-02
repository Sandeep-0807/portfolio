/// <reference types="vite/client" />

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: any[]) => void;
	}
}

export {};
