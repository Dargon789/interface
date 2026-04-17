import { createApp } from 'functions/app'

const mockHtml = `<!DOCTYPE html><html><head><title>Uniswap</title></head><body></body></html>`

function buildApp() {
  return createApp({
    fetchSpaHtml: async () => new Response(mockHtml, { headers: { 'content-type': 'text/html' } }),
    getEntryGatewayUrl: () => 'https://entry-gateway.backend-prod.api.uniswap.org',
    getWebSocketUrl: () => 'https://websockets.backend-prod.api.uniswap.org',
    getTrustedClientIp: () => undefined,
  })
}

describe('frame protection headers', () => {
  it('sets frame-ancestors CSP header on SPA routes', async () => {
    const app = buildApp()
    const res = await app.request('/')

    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self' https://app.safe.global")
  })

  it('sets X-Frame-Options header on SPA routes', async () => {
    const app = buildApp()
    const res = await app.request('/')

    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })

  it('sets frame headers on /swap route', async () => {
    const app = buildApp()
    const res = await app.request('/swap')

    expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self' https://app.safe.global")
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })

  it('does not include other CSP directives in the frame-ancestors header', async () => {
    const app = buildApp()
    const res = await app.request('/')

    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).not.toContain('default-src')
    expect(csp).not.toContain('script-src')
  })
})
