import MD5 from 'crypto-js/md5'

export function buildGhostCutSign(bodyString: string, appSecret: string) {
	const firstPass = MD5(bodyString).toString()
	return MD5(`${firstPass}${appSecret}`).toString()
}
