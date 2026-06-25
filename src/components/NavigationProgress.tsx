'use client'

import { AppProgressBar } from 'next-nprogress-bar'

export default function NavigationProgress() {
  return (
    <AppProgressBar
      height="3px"
      color="#059669"
      options={{ showSpinner: false, trickleSpeed: 200 }}
      shallowRouting
    />
  )
}
