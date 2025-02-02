import { Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Passkey, AnimatedPasskey] = createIcon({
  name: 'Passkey',
  getIcon: (props) => (
    <Svg viewBox="0 0 48 48" fill="none" {...props}>
      <Rect width="48" height="48" rx="7.819" fill="white" fillOpacity="0.12" />
      <Path
        d="M20.3827 13.308C20.2688 13.3283 20.0289 13.3934 19.858 13.4544C18.2595 13.9913 16.962 15.3824 16.5186 17.0379C16.421 17.4039 16.4129 17.5056 16.4088 18.2703C16.4047 18.8357 16.421 19.1773 16.4576 19.3278C16.9294 21.2762 18.2758 22.6957 20.1468 23.2204C20.4519 23.3058 20.6308 23.3262 21.2288 23.3424C22.3473 23.375 22.8151 23.2855 23.6977 22.8665C24.4624 22.5005 25.0807 21.9839 25.585 21.2762C25.9267 20.7962 26.0935 20.483 26.2724 19.9827C26.4839 19.3726 26.5287 19.0309 26.5002 18.0751C26.4758 17.1192 26.4107 16.8345 26.0243 16.0535C25.3938 14.7723 24.3688 13.8937 22.9534 13.4259L22.5466 13.2917L21.5704 13.2836C21.0335 13.2754 20.5007 13.2876 20.3827 13.308Z"
        fill="white"
      />
      <Path
        d="M30.0912 19.5475C29.9 19.5963 29.6438 19.6817 29.5218 19.7346C28.7083 20.0884 27.9111 20.8369 27.5206 21.6259C27.0488 22.5696 26.9877 23.8508 27.3701 24.8108C27.7077 25.6568 28.3178 26.3686 29.0703 26.7916L29.3591 26.9543L29.3631 30.0049L29.3713 33.0555L30.2173 33.8894L31.0674 34.7191L32.4707 33.3199C33.2435 32.5471 33.874 31.9004 33.874 31.876C33.874 31.8556 33.5038 31.4651 33.0523 31.0137L32.2266 30.188L32.7798 29.6307C33.4957 28.9067 33.874 28.5081 33.874 28.4674C33.874 28.4512 33.6055 28.1624 33.276 27.8248C32.9466 27.4872 32.6537 27.1821 32.6293 27.1414C32.5846 27.0804 32.609 27.056 32.8286 26.934C33.7682 26.4256 34.3905 25.7422 34.7607 24.8189C34.96 24.3186 35.0495 23.5092 34.9722 22.8299C34.8135 21.386 33.7357 20.0925 32.2999 19.6166C31.7182 19.4214 30.6769 19.3888 30.0912 19.5475ZM31.4457 21.2233C31.828 21.3534 32.247 21.9798 32.19 22.3377C32.1534 22.5655 31.9297 22.9763 31.767 23.1106C31.4498 23.375 30.9373 23.4278 30.5752 23.2407C29.9855 22.9357 29.7862 22.175 30.1522 21.6463C30.2661 21.4795 30.5346 21.2761 30.7217 21.207C30.9047 21.1419 31.2301 21.15 31.4457 21.2233Z"
        fill="white"
      />
      <Path
        d="M19.6378 25.1037C18.3484 25.1525 17.4901 25.3762 16.5261 25.909C14.8747 26.8201 13.6667 28.3576 13.1949 30.1473C13.02 30.8103 12.9874 31.3188 13.0037 33.2671L13.0078 34.0928H20.3496H27.6913V30.9974V27.9062L27.2317 27.4506C26.6907 26.9137 26.467 26.633 26.1294 26.0473L25.8813 25.6162L25.3322 25.4413C24.3601 25.124 24.0998 25.0955 22.1392 25.0833C21.1997 25.0752 20.073 25.0874 19.6378 25.1037Z"
        fill="white"
      />
    </Svg>
  ),
})
