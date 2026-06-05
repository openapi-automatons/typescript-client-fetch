import { serialize } from 'object-to-formdata';

export const body = <T = unknown>(type: string, form: T): BodyInit | undefined => {
	if (form === undefined || form === null) return undefined;
	switch (type) {
		case 'multipart/form-data':
			return serialize(form);
		case 'application/x-www-form-urlencoded':
			return new URLSearchParams(form as unknown as Record<string, string>);
		default:
			return JSON.stringify(form);
	}
}
