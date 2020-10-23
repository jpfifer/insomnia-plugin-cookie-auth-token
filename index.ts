import Cookie = Insomnia.Models.Cookies.Cookie;

type TokenResponse = {
  access_token: string;
  expires_in: number;
}

type Jwt = {
  exp: number;
}

const getCookie = async (context: Insomnia.Context, cookieDomain: string, authCookieName): Promise<[Insomnia.Models.Cookies.Cookie, Insomnia.Models.Cookies.CookieJar]> => {
  const workspace = await context.util.models.workspace.getById(context.meta.workspaceId);
  const cookieJar = await context.util.models.cookieJar.getOrCreateForWorkspace(workspace);
  const cookie = cookieJar.cookies.find(c => c.key === authCookieName && c.domain.toLowerCase() === cookieDomain);

  return [cookie, cookieJar];
}

const isCookieStale = (cookie: Cookie) => {
  const now = Date.now();
  const expires = Date.parse(cookie.expires);
  return now > expires;
}

const isJwtStale = (jwt: TokenResponse) => {
  if (!jwt || !jwt.access_token) {
    return true;
  }

  const token = jwt.access_token.split('.')[1];
  const decoded = atob(token);
  const json: Jwt = JSON.parse(decoded);

  const now = Date.now();
  const expires = json.exp * 1000;
  return now > expires;
}

/**
 * The plugin definition that is used by Insomnia to configure and load the plugin
 */
export const templateTags: Insomnia.TemplateTag[] = [
  {
    name: 'CookieAuthToken',
    displayName: 'Cookie Auth Token',
    description: 'Retrieve an auth token from the cookie of another request',
    args: [
      {
        displayName: 'Request',
        type: 'model',
        model: 'Request',
        description: 'A request that should set the authentication cookie after successfully completing'
      },
      {
        displayName: 'Cookie Domain',
        type: 'string',
        description: 'The domain the cookie was issued for',
      },
      {
        displayName: 'Authentication Cookie Name',
        type: 'string',
        description: 'The name of the authentication cookie that should be set after the request.'
      }
    ],
    async run(context: Insomnia.Context, requestId, cookieDomain: string, authCookieName: string) {

      if (!requestId) {
        throw new Error("Request is required");
      }
      if (!cookieDomain) {
        throw new Error("Cookie Domain is required");
      }
      if (!authCookieName) {
        throw new Error("Authentication Cookie Name is required");
      }
      if (!requestId) {
        console.log(`No requestId`);
        throw new Error('No request provided');
      }

      const request = await context.util.models.request.getById(requestId);
      if (!request) {
        throw new Error(`Could not find request for requestId: ${requestId}`);
      }

      let [cookie, cookieJar] = await getCookie(context, cookieDomain, authCookieName);
      let jwt: TokenResponse = cookie?.value ? JSON.parse(cookie.value) : null;
      if (isJwtStale(jwt) || isCookieStale(cookie)) {
        const response = await context.network.sendRequest(request);
        if (response.statusCode !== 200) {
          throw new Error(`Dependent request ${request.name} failed. Status: ${response.statusCode}`);
        }
        [cookie, cookieJar] = await getCookie(context, cookieDomain, authCookieName);
        jwt = cookie?.value ? JSON.parse(cookie.value) : null;
        if (isJwtStale(jwt) || isCookieStale(cookie)) {
          throw new Error(`Got a stale/jwt cookie after an update: ${cookie.expires}`);
        }
      }

      if (jwt?.access_token) {
        return jwt.access_token;
      }

      console.log(`No ${authCookieName} cookie for ${cookieDomain} found in Cookie Jar`, cookieJar);
      throw new Error(`No ${authCookieName} cookie for ${cookieDomain} found in Cookie Jar`);
    }
  }
];
