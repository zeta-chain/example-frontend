import { BitcoinNetworkType, RpcErrorCode } from 'sats-connect';
import Wallet from 'sats-connect';
import * as btc from 'micro-btc-signer';

export default async function signPsbt(
	psbtBase64: string,
	senderAddress: string,
) {
	console.log('signing address', senderAddress);
	// Get the PSBT Base64 from the input

	if (!psbtBase64) {
		alert('Please enter a valid PSBT Base64 string.');
		return;
	}

	try {
		const response = await Wallet.request('signPsbt', {
			psbt: psbtBase64,
			allowedSignHash: btc.SignatureHash.ALL,
			broadcast: true,
			signInputs: {
				[senderAddress]: [0],
			},
		});

		if (response.status === 'success') {
			console.log('PSBT signed successfully!');
			console.log('Signed PSBT:', response.result.psbt);
			alert('PSBT signed successfully!');
		} else {
			if (response.error.code === RpcErrorCode.USER_REJECTION) {
				console.log('User canceled the request');
				alert('Request canceled by user');
			} else {
				console.error('Error signing PSBT:', response.error);
				alert('Error signing PSBT: ' + response.error.message);
			}
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		alert('Error while signing');
	}
}
