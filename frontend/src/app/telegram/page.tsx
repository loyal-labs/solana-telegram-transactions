'use client';

import { hashes } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

import { cleanInitData, createValidationString, validateInitData } from '@/lib/telegram/init-data-transform';
import {
  initData,
  useLaunchParams,
  useRawInitData,
  useSignal
} from '@telegram-apps/sdk-react';

import { TELEGRAM_BOT_ID } from '@/lib/telegram/constants';
import { useEffect } from 'react';

hashes.sha512 = sha512;

export default function Home() {
  const lp = useLaunchParams();
  const rawInitData = useRawInitData();
  const initDataUser = useSignal(initData.user);

  useEffect(() => {
    if (rawInitData) {
      const cleanInitDataResult = cleanInitData(rawInitData);
      const validationString = createValidationString(TELEGRAM_BOT_ID, cleanInitDataResult);

      const signature = cleanInitDataResult.signature as string;
      const isValid = validateInitData(validationString, signature);
      console.log("Signature is valid: ", isValid);
    }
  }, [rawInitData]);


    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Next.js!</h1>
        <p className="mt-4 text-lg text-gray-600">
          Get started by editing <code>src/app/page.tsx</code>
        </p>
        <a
          className="mt-6 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the Next.js docs
        </a>
      </main>
    );
  }
  
