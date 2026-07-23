exports.id=567,exports.ids=[567,8254],exports.modules={6384:(a,b,c)=>{"use strict";c.d(b,{X:()=>j});let d=null;async function e(a){let b=function(){if(d)return d;let a=process.env.SMTP_HOST,b=parseInt(process.env.SMTP_PORT??"465",10),e=process.env.SMTP_USER,f=process.env.SMTP_PASS;if(!a||!e||!f)throw Error("[Mailer] SMTP_HOST, SMTP_USER, SMTP_PASS environment variables are required.");return d=c(21572).createTransport({host:a,port:b,secure:465===b,auth:{user:e,pass:f},connectionTimeout:1e4,socketTimeout:3e4,tls:{rejectUnauthorized:!0}})}(),e=`"Misi Pintar" <${process.env.SMTP_USER}>`;await b.sendMail({from:e,to:a.to,subject:a.subject,html:a.html,text:a.text,attachments:a.attachments?.map(a=>({filename:a.filename,content:a.content,contentType:a.contentType}))})}function f(a){return"Rp "+a.toLocaleString("id-ID")}function g(a){return new Date(a).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}let h={QRIS:"QRIS",GOPAY:"GoPay",SHOPEEPAY:"ShopeePay",BANK_TRANSFER:"Transfer Bank",CREDIT_CARD:"Kartu Kredit",VA:"Virtual Account",MANDIRI_VA:"Mandiri Virtual Account",EWALLET:"E-wallet"};function i(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}async function j(a){let b,d,j,k;if(!a.customer.email)return void console.warn(`[ReceiptEmail] No email for invoice ${a.invoiceNumber} — skipped`);let l=process.env.APP_URL??process.env.NEXTAUTH_URL??"https://mp.jobenapp.cloud",m=`${l}/dashboard/billing/invoice/${a.invoiceId}`,[n,{renderToBuffer:o},{InvoiceReceiptPDF:p}]=await Promise.all([Promise.resolve().then(c.t.bind(c,91986,23)),Promise.resolve().then(c.bind(c,972)),c.e(3191).then(c.bind(c,63191))]),q={invoiceNumber:a.invoiceNumber,orderId:a.orderId,paymentProvider:a.paymentProvider,issuedAt:a.issuedAt.toISOString(),paidAt:a.paidAt.toISOString(),status:"PAID",amount:a.amount,currency:a.currency,paymentMethod:a.paymentMethod,billingCycle:a.billingCycle,customer:{name:a.customer.name,email:a.customer.email,phone:a.customer.phone,familySpaceName:a.familySpaceName},plan:a.plan,periodStart:a.periodStart.toISOString(),periodEnd:a.periodEnd.toISOString()},r=n.default.createElement(p,{data:q}),s=await o(r),t=`Kuitansi-${a.invoiceNumber}.pdf`,u={customerName:a.customer.name,customerEmail:a.customer.email,familySpaceName:a.familySpaceName,invoiceNumber:a.invoiceNumber,orderId:a.orderId,paymentProvider:a.paymentProvider,planName:a.plan.name,billingCycle:a.billingCycle,amount:a.amount,currency:a.currency,paymentMethod:a.paymentMethod,paidAt:a.paidAt.toISOString(),periodStart:a.periodStart.toISOString(),periodEnd:a.periodEnd.toISOString(),receiptUrl:m},v=(b="YEARLY"===u.billingCycle?"Tahunan":"Bulanan",d=u.paymentMethod?h[u.paymentMethod]??u.paymentMethod:"—",`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kuitansi Pembayaran — Misi Pintar</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%);border-radius:16px 16px 0 0;padding:36px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#a7f3d0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Misi Pintar</p>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">Pembayaran Berhasil ✅</h1>
                    <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">Terima kasih, <strong>${i(u.customerName)}</strong>. Langganan Anda telah aktif.</p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background:rgba(255,255,255,0.2);border-radius:10px;padding:8px 14px;display:inline-block;">
                      <p style="margin:0;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;">LUNAS</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px;">

              <!-- Active period banner -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 2px;color:#065f46;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✓ Langganan Aktif</p>
                    <p style="margin:0;color:#047857;font-size:14px;font-weight:600;">${g(u.periodStart)} — ${g(u.periodEnd)}</p>
                  </td>
                </tr>
              </table>

              <!-- Meta grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Penerima</p>
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${i(u.customerName)}</p>
                    <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${i(u.customerEmail)}</p>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Ruang Keluarga</p>
                    <p style="margin:0;color:#374151;font-size:14px;">${i(u.familySpaceName)}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Tanggal Bayar</p>
                    <p style="margin:0;color:#374151;font-size:14px;">${g(u.paidAt)}</p>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Metode Pembayaran</p>
                    <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${i(d)}</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

              <!-- Item table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 12px;border-radius:8px 0 0 0;">
                    <p style="margin:0;color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Deskripsi</p>
                  </td>
                  <td align="right" style="padding:10px 12px;border-radius:0 8px 0 0;">
                    <p style="margin:0;color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Jumlah</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;">
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">Misi Pintar ${i(u.planName)}</p>
                    <p style="margin:3px 0 0;color:#6b7280;font-size:12px;">Langganan ${b}</p>
                  </td>
                  <td align="right" style="padding:16px 12px;border-bottom:1px solid #f3f4f6;">
                    <p style="margin:0;color:#374151;font-size:14px;">${f(u.amount)}</p>
                  </td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 12px;">
                    <p style="margin:0;color:#6b7280;font-size:12px;">PPN (0%)</p>
                  </td>
                  <td align="right" style="padding:10px 12px;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">Rp 0</p>
                  </td>
                </tr>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#059669;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;color:#d1fae5;font-size:12px;font-weight:600;letter-spacing:0.5px;">TOTAL DIBAYAR</p>
                  </td>
                  <td align="right" style="padding:14px 16px;">
                    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">${f(u.amount)}</p>
                  </td>
                </tr>
              </table>

              <!-- Reference box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 12px;color:#374151;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Referensi Pembayaran</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Nomor Invoice</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;font-family:monospace;">${i(u.invoiceNumber)}</p>
                        </td>
                      </tr>
                      ${u.orderId?`
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Referensi Provider</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;font-family:monospace;">${i(u.orderId)}</p>
                        </td>
                      </tr>`:""}
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Platform</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;">${"DOKU"===u.paymentProvider?"DOKU Checkout":"Midtrans"}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Mata Uang</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;">${i(u.currency)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <a href="${u.receiptUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.3px;">
                      ↓ Lihat &amp; Unduh Kuitansi PDF
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;text-align:center;color:#9ca3af;font-size:11px;">Kuitansi PDF juga terlampir di email ini.</p>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#374151;font-size:13px;font-weight:700;">Misi Pintar</p>
                    <p style="margin:0;color:#9ca3af;font-size:11px;">Platform Literasi Keuangan Keluarga</p>
                    <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;">
                      Pertanyaan? Hubungi kami di
                      <a href="mailto:${process.env.SMTP_USER??"support@jobenapp.cloud"}" style="color:#059669;text-decoration:none;">support@jobenapp.cloud</a>
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <p style="margin:0;color:#d1d5db;font-size:10px;font-family:monospace;">${i(u.invoiceNumber)}</p>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
              <p style="margin:0;color:#d1d5db;font-size:10px;text-align:center;">
                Email ini dikirim secara otomatis. Mohon tidak membalas email ini langsung.<br/>
                Dokumen ini merupakan bukti pembayaran yang sah secara digital.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`),w=(j="YEARLY"===u.billingCycle?"Tahunan":"Bulanan",k=u.paymentMethod?h[u.paymentMethod]??u.paymentMethod:"—",`
PEMBAYARAN BERHASIL — Misi Pintar
===================================

Halo ${u.customerName},

Pembayaran Anda telah berhasil dikonfirmasi. Berikut rincian kuitansi Anda.

LANGGANAN AKTIF
---------------
Periode: ${g(u.periodStart)} — ${g(u.periodEnd)}

DETAIL PEMBAYARAN
-----------------
Nama         : ${u.customerName}
Email        : ${u.customerEmail}
Ruang Keluarga: ${u.familySpaceName}
Tanggal Bayar: ${g(u.paidAt)}
Metode       : ${k}

RINCIAN PESANAN
---------------
Misi Pintar ${u.planName} — Langganan ${j}
Subtotal     : ${f(u.amount)}
PPN          : Rp 0
TOTAL DIBAYAR: ${f(u.amount)}

REFERENSI
---------
Nomor Invoice: ${u.invoiceNumber}
${u.orderId?`Referensi    : ${u.orderId}
`:""}Platform     : ${"DOKU"===u.paymentProvider?"DOKU Checkout":"Midtrans"}
Mata Uang    : ${u.currency}

Unduh kuitansi PDF Anda di:
${u.receiptUrl}

Kuitansi PDF juga terlampir di email ini.

--
Misi Pintar — Platform Literasi Keuangan Keluarga
Pertanyaan? Hubungi support@jobenapp.cloud
`.trim());await e({to:a.customer.email,subject:`✅ Kuitansi Pembayaran ${a.invoiceNumber} — Misi Pintar`,html:v,text:w,attachments:[{filename:t,content:Buffer.from(s),contentType:"application/pdf"}]}),console.info(`[ReceiptEmail] Sent to ${a.customer.email} — ${a.invoiceNumber}`)}},19225:(a,b,c)=>{"use strict";a.exports=c(44870)},32787:(a,b,c)=>{"use strict";c.d(b,{$M:()=>h,I9:()=>f,ZE:()=>e,c:()=>g});var d=c(98254);async function e(a,b){if(d.redis)try{await d.redis.publish(`sse:family:${a}`,JSON.stringify(b))}catch(a){console.error("[SSE] publishToFamily error:",a)}}async function f(a){if(d.redis)try{await d.redis.incr(`notif:unread:${a}`)}catch{}}async function g(a){if(d.redis)try{await d.redis.del(`notif:unread:${a}`)}catch{}}async function h(a){if(!d.redis)return 0;try{let b=await d.redis.get(`notif:unread:${a}`);return parseInt(b??"0",10)||0}catch{return 0}}},70484:(a,b,c)=>{"use strict";c.d(b,{I9:()=>h,SG:()=>g});var d=c(93061);let e=null;async function f(){if("1"===process.env.NEXT_BUILD)return null;if(e)return e;let a=process.env.FIREBASE_PROJECT_ID,b=process.env.FIREBASE_CLIENT_EMAIL,d=process.env.FIREBASE_PRIVATE_KEY;if(!a||!b||!d)return console.log("[FCM] Firebase env tidak lengkap — push notifications dinonaktifkan"),null;try{let{initializeApp:f,getApps:g,cert:h}=await Promise.resolve().then(c.bind(c,9801)),{getMessaging:i}=await Promise.resolve().then(c.bind(c,92602)),j=0===g().length?f({credential:h({projectId:a,clientEmail:b,privateKey:d.replace(/\\n/g,"\n")})}):g()[0];return e=i(j)}catch(a){return console.error("[FCM] Gagal init firebase-admin:",a),null}}async function g(a,b,c,e){if(0===a.length)return{successCount:0,failureCount:0};let g=await f();if(!g)return{successCount:0,failureCount:0};try{let f=await g.sendEachForMulticast({tokens:a,notification:{title:b,body:c},data:e??{},android:{priority:"high",notification:{channelId:"misi-pintar-default"}}}),h=[];return f.responses.forEach((b,c)=>{if(!b.success){let d=b.error?.code;("messaging/registration-token-not-registered"===d||"messaging/invalid-registration-token"===d)&&h.push(a[c])}}),h.length>0&&(await d.z.fcmToken.deleteMany({where:{token:{in:h}}}),console.log(`[FCM] Removed ${h.length} invalid token(s)`)),{successCount:f.successCount,failureCount:f.failureCount}}catch(b){return console.error("[FCM] sendEachForMulticast error:",b),{successCount:0,failureCount:a.length}}}async function h(a){return(await d.z.fcmToken.findMany({where:{userId:a},select:{token:!0}})).map(a=>a.token)}},78335:()=>{},81764:(a,b,c)=>{"use strict";function d(a){return({STARTER:"FREE",PRO:"PRO",EDUCATOR:"EDUCATOR",SCHOOL:"SCHOOL"})[a]??"FREE"}c.d(b,{DV:()=>d,TB:()=>e});let e=["\uD83E\uDDD2","\uD83D\uDC66","\uD83D\uDC67","\uD83E\uDDD1","\uD83D\uDC31","\uD83D\uDC36","\uD83E\uDD81","\uD83D\uDC3C","\uD83E\uDD8A","\uD83D\uDC2F"]},92280:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},93061:(a,b,c)=>{"use strict";let d;c.d(b,{z:()=>f});let e=globalThis,f=new Proxy({},{get:(a,b)=>(d||(d=e.prisma??function(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let{PrismaClient:a}=c(96330);return new a({log:["error"]})}(),e.prisma=d),Reflect.get(d,b,d))})},96487:()=>{},98254:(a,b,c)=>{"use strict";c.d(b,{redis:()=>d});let d=globalThis.redis??function(){if("1"===process.env.NEXT_BUILD)return;let a=process.env.REDIS_URL;return a?new(c(37659)).default(a,{maxRetriesPerRequest:3,retryStrategy:a=>Math.min(50*a,2e3),lazyConnect:!0}):void console.warn("[redis] REDIS_URL not set — rate limiting disabled")}()}};