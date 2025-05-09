'use client'

import { SignUp } from "@clerk/nextjs"
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-bold">
          Agentes de Conversão
        </Link>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Crie sua conta para começar
        </p>
      </div>
      
      <div className="w-full max-w-md">
        <SignUp 
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white dark:bg-gray-800 shadow-md rounded-lg",
              headerTitle: "text-xl font-bold",
              headerSubtitle: "text-gray-600 dark:text-gray-400",
              socialButtonsBlockButton: "border-gray-300 dark:border-gray-700",
              formFieldLabel: "text-gray-700 dark:text-gray-300",
              formFieldInput: "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800",
              footer: "text-center text-gray-600 dark:text-gray-400",
              footerActionLink: "text-blue-600 dark:text-blue-400 hover:underline"
            }
          }}
        />
      </div>
      
      <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
        <p>
          Já tem uma conta?{' '}
          <Link href="/sign-in" className="text-blue-600 dark:text-blue-400 hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}