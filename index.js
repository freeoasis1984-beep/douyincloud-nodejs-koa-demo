/**
 * 抖音云容器入口：监听 8000（与官方 Koa 模板一致）
 * 环境变量（在抖音云「服务设置 / 环境变量」里配置，勿提交密钥到仓库）：
 *   MINI_APP_ID     小程序 AppID
 *   MINI_APP_SECRET 小程序 AppSecret（仅服务端保存）
 */
'use strict';

var Koa = require('koa');
var Router = require('@koa/router');
var bodyParser = require('koa-bodyparser');
var https = require('https');

var Jscode2sessionURL =
  process.env.JSCODE2SESSION_URL ||
  'https://developer.toutiao.com/api/apps/v2/jscode2session';

function postJson(url, bodyObj) {
  var body = JSON.stringify(bodyObj);
  return new Promise(function (resolve, reject) {
    var u = new URL(url);
    var req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      function (res) {
        var raw = '';
        res.on('data', function (c) {
          raw += c;
        });
        res.on('end', function () {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error('invalid json from jscode2session'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

var app = new Koa();
var router = new Router();

router.get('/', function (ctx) {
  ctx.body = 'xunduna cloud ok';
});

router.get('/api/health', function (ctx) {
  ctx.body = { ok: true, ts: Date.now() };
});

router.post('/api/login', async function (ctx) {
  var body = ctx.request.body || {};
  var code = body.code;
  var appid = process.env.MINI_APP_ID;
  var secret = process.env.MINI_APP_SECRET;

  if (!code || String(code).trim() === '') {
    ctx.status = 400;
    ctx.body = { success: false, message: 'missing code' };
    return;
  }
  if (!appid || !secret) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'server missing MINI_APP_ID or MINI_APP_SECRET',
    };
    return;
  }

  try {
    var json = await postJson(Jscode2sessionURL, {
      appid: appid,
      secret: secret,
      code: String(code).trim(),
    });

    var errNo = json.err_no != null ? json.err_no : json.errno;
    if (errNo !== 0 && errNo !== undefined && errNo !== null) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: json.err_tips || json.errMsg || 'jscode2session failed',
        err_no: errNo,
      };
      return;
    }

    var data = json.data || json;
    var openid = data.openid;
    var unionid = data.unionid || '';
    if (!openid) {
      ctx.status = 502;
      ctx.body = { success: false, message: 'no openid in response' };
      return;
    }

    ctx.body = {
      success: true,
      data: {
        openid: openid,
        unionid: unionid,
        nickName: body.nickName || '',
        avatarUrl: body.avatarUrl || '',
      },
    };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { success: false, message: e.message || 'internal error' };
  }
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

var PORT = parseInt(process.env.PORT, 10) || 8000;
app.listen(PORT, function () {
  console.log('listening on ' + PORT);
});
