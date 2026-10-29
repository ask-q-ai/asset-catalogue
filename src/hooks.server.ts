import { env } from '$env/dynamic/private';
import type { ServerInit } from '@sveltejs/kit';
import { readSettings } from '$lib/server/settings';

/** The service refuses to start unless every setting is present and right. */
export const init: ServerInit = () => {
  readSettings(env);
};
