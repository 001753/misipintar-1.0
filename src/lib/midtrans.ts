// midtrans-client di-require() secara lazy — BUKAN static import + instantiation di atas.
//
// Root cause: `import midtransClient from "midtrans-client"` + `new midtransClient.Snap({})`
// keduanya berjalan di module level, sehingga dieksekusi saat build worker meng-import
// modul ini. Meski midtrans-client adalah pure JS, beban inisialisasi module-level
// menambah risiko crash pada environment cPanel yang memiliki resource limit ketat.
//
// Fix: Proxy lazy — Snap/CoreApi hanya diinisialisasi saat method pertama dipanggil
// di server runtime, bukan saat build.

import crypto from "crypto";
import type midtransClientType from "midtrans-client";

type MidtransSnap = InstanceType<typeof import('midtrans-client')['Snap']>
type MidtransCoreApi = InstanceType<typeof import('midtrans-client')['CoreApi']>

function getMidtransClient(): typeof midtransClientType {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("midtrans-client") as typeof midtransClientType
}

const isProduction = () => process.env.MIDTRANS_IS_PRODUCTION === "true";

let _snap: MidtransSnap | undefined
let _coreApi: MidtransCoreApi | undefined

export const snap: MidtransSnap = new Proxy({} as MidtransSnap, {
  get(_, prop: string | symbol) {
    if (!_snap) {
      const mc = getMidtransClient()
      _snap = new mc.Snap({
        isProduction: isProduction(),
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      })
    }
    return Reflect.get(_snap, prop, _snap)
  },
})

export const coreApi: MidtransCoreApi = new Proxy({} as MidtransCoreApi, {
  get(_, prop: string | symbol) {
    if (!_coreApi) {
      const mc = getMidtransClient()
      _coreApi = new mc.CoreApi({
        isProduction: isProduction(),
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      })
    }
    return Reflect.get(_coreApi, prop, _coreApi)
  },
})

export function validateMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signature: string
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return hash === signature;
}
