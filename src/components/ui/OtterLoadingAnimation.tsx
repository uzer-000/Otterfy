'use client';

import React from 'react';

interface Props {
  size?: 'splash' | 'compact' | 'normal';
  idPrefix?: string;
  className?: string;
}

const OTTER_MAIN_PATH =
  'M565.2 1243.7C443.5 1238.3 334.2 1191.0 249.2 1107.0C165.3 1024.0 115.7 914.6 108.0 795.5C107.5 787.7 107.0 774.5 107.0 768.9L107.0 764.0L166.5 764.1L226.0 764.2L228.6 769.7C275.6 869.6 396.8 931.6 560.2 939.3C609.1 941.6 667.0 936.2 716.3 924.8C824.2 899.8 901.9 845.9 937.8 771.2C939.3 768.1 940.7 765.2 940.8 764.8L941.0 764.0L1001.1 764.0L1061.1 764.0L1060.9 773.9C1057.6 915.3 996.3 1044.2 889.6 1133.7C815.3 1196.1 723.0 1233.9 624.7 1242.3C609.3 1243.6 579.7 1244.3 565.2 1243.7ZM568.8 905.6C423.2 900.2 306.4 847.3 263.8 767.5L261.9 764.0L583.5 764.0C760.3 764.0 905.0 764.1 905.0 764.3C905.0 764.7 900.5 772.8 897.7 777.2C853.4 848.6 746.6 896.6 614.2 904.8C595.8 906.0 583.4 906.2 568.8 905.6ZM107.0 534.0L107.0 378.1L101.5 373.7C59.4 340.1 41.6 308.4 44.3 271.7C48.0 222.0 78.5 183.1 118.8 176.8C120.7 176.5 126.4 176.2 132.2 176.0C156.5 175.2 172.6 172.4 194.0 165.4C219.1 157.0 242.5 145.5 288.1 118.9C315.9 102.8 341.2 90.6 370.3 79.6C512.3 25.7 666.5 27.0 807.2 83.3C829.2 92.1 853.8 103.8 870.8 113.7C873.6 115.2 880.7 119.4 886.7 122.8C926.2 145.7 948.7 156.8 971.8 164.6C993.8 172.1 1011.1 175.2 1036.0 176.0C1052.0 176.5 1059.9 178.3 1071.2 183.9C1100.7 198.6 1120.7 232.1 1123.7 271.7C1126.4 308.0 1108.8 339.7 1067.2 373.1L1061.0 378.1L1061.0 534.1L1061.0 690.0L985.1 690.0L909.2 690.0L906.8 685.6C891.0 655.6 868.3 621.3 843.7 589.7C824.7 565.3 807.3 544.9 773.2 507.0C736.0 465.7 726.0 454.0 713.6 437.3C707.7 429.5 698.6 415.6 699.1 415.2C699.1 415.1 701.9 417.2 705.2 419.7C743.2 449.2 764.3 462.6 787.8 471.9C809.4 480.5 833.4 484.1 849.2 481.3C904.1 471.3 933.3 430.4 938.7 355.8C938.9 353.1 939.1 350.2 939.1 349.4C939.3 348.0 939.2 348.0 938.4 348.1C937.9 348.2 934.8 348.8 931.5 349.3C908.5 353.3 883.9 358.2 821.5 371.5C756.3 385.4 725.9 391.6 697.8 396.7C679.0 400.1 679.3 400.0 679.3 400.3C679.3 400.8 682.5 409.0 684.2 412.8C691.9 430.6 705.0 450.8 724.8 475.5C734.0 486.9 741.0 495.2 765.8 523.8C820.8 587.1 844.3 618.0 867.6 657.5C873.6 667.7 885.0 688.8 885.0 689.8C885.0 689.9 817.9 690.0 735.9 689.9C653.9 689.9 587.5 689.8 588.3 689.8C636.9 686.0 684.1 650.9 695.8 609.8C697.7 602.9 698.2 599.9 697.7 596.1C695.0 571.4 665.3 554.6 615.5 549.5C601.6 548.1 576.0 547.7 563.2 548.6C510.7 552.5 479.4 566.5 471.7 589.6C469.5 596.1 469.6 600.2 472.1 609.2C483.5 650.3 529.4 685.0 578.3 689.6C579.9 689.8 513.8 689.9 431.6 690.0L281.9 690.0L285.6 682.9C307.5 640.4 335.8 600.2 380.5 548.0C384.3 543.5 394.8 531.4 403.7 521.2C433.5 486.8 445.9 471.7 457.1 456.4C471.4 436.6 481.8 418.1 487.0 402.8L487.9 400.0L487.1 399.9C486.6 399.8 479.9 398.5 472.2 397.2C436.6 390.7 412.2 385.7 322.1 366.5C288.8 359.4 256.4 352.9 236.7 349.5C232.9 348.9 229.4 348.2 228.9 348.1L227.9 347.9L228.2 351.1C233.7 429.6 260.6 469.4 316.0 480.9C331.8 484.2 354.7 481.2 376.6 473.0C400.5 464.0 423.9 449.5 460.7 420.8C469.0 414.3 468.6 414.5 467.5 416.5C457.1 434.5 441.5 454.2 407.5 492.0C380.5 522.1 376.4 526.6 370.5 533.3C321.2 589.1 287.1 636.1 261.4 683.7L258.1 689.8L182.5 689.9L107.0 690.0L107.0 534.0Z';

export default function OtterLoadingAnimation({
  size = 'normal',
  idPrefix = 'otter',
  className = '',
}: Props) {
  const isLoop = size !== 'splash';
  const ctId = `${idPrefix}-ct`;
  const cbId = `${idPrefix}-cb`;
  const meId = `${idPrefix}-me`;
  const msId = `${idPrefix}-ms`;
  const mnId = `${idPrefix}-mn`;
  const mbId = `${idPrefix}-mb`;

  const sizeClasses =
    size === 'splash'
      ? 'w-[min(56vw,230px)] h-[min(56vw,230px)] sm:w-[230px] sm:h-[230px]'
      : size === 'compact'
      ? 'w-[135px] h-[135px] sm:w-[155px] sm:h-[155px]'
      : 'w-[min(46vw,185px)] h-[min(46vw,185px)] sm:w-[185px] sm:h-[185px]';

  return (
    <div
      className={`otter-new-wrap ${isLoop ? 'otter-anim-loop' : ''} flex flex-col items-center justify-center gap-4 sm:gap-5 select-none ${className}`}
      role="img"
      aria-label="Carregando Otterfy"
    >
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        {/* Soft Purple Backlight Aura */}
        <div className="otter-new-aura" aria-hidden="true" />

        {/* Nova Logo Animada Oficial 3.9s */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-116 -58 1400 1400"
          className="relative z-10 w-full h-full overflow-visible drop-shadow-[0_6px_20px_rgba(123,31,162,0.32)]"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={ctId}>
              <rect x="-300" y="-300" width="1800" height="1027" />
            </clipPath>
            <clipPath id={cbId}>
              <rect x="-300" y="727" width="1800" height="900" />
            </clipPath>
            <mask id={meId} maskUnits="userSpaceOnUse" x="-300" y="-300" width="1800" height="1100">
              <rect x="-300" y="-300" width="1800" height="1100" fill="#fff" />
              <path
                className="otter-anim-eye"
                d="M228 348C300 360 400 385 488 400C446 430 390 486 322 482C258 472 232 424 228 348Z"
                fill="#000"
                stroke="#000"
                strokeWidth="10"
              />
              <g transform="translate(1167.2 0) scale(-1 1)">
                <path
                  className="otter-anim-eye"
                  d="M228 348C300 360 400 385 488 400C446 430 390 486 322 482C258 472 232 424 228 348Z"
                  fill="#000"
                  stroke="#000"
                  strokeWidth="10"
                />
              </g>
            </mask>
            <mask id={msId} maskUnits="userSpaceOnUse" x="-300" y="-300" width="1800" height="1100">
              <rect x="-300" y="-300" width="1800" height="1100" fill="#fff" />
              <path
                className="otter-anim-stem"
                d="M494 377L481 404C444 480 336 562 270 704"
                fill="none"
                stroke="#000"
                strokeWidth="58"
                strokeLinecap="butt"
              />
              <g transform="translate(1167.2 0) scale(-1 1)">
                <path
                  className="otter-anim-stem"
                  d="M494 377L481 404C444 480 336 562 270 704"
                  fill="none"
                  stroke="#000"
                  strokeWidth="58"
                  strokeLinecap="butt"
                />
              </g>
            </mask>
            <mask id={mnId} maskUnits="userSpaceOnUse" x="-300" y="-300" width="1800" height="1100">
              <rect x="-300" y="-300" width="1800" height="1100" fill="#fff" />
              <path
                className="otter-anim-nose"
                d="M470 600C470 565 520 548 584 548C648 548 698 565 698 600C690 650 635 688 584 690C533 688 478 650 470 600Z"
                fill="#000"
                stroke="#000"
                strokeWidth="10"
              />
            </mask>
            <mask id={mbId} maskUnits="userSpaceOnUse" x="-300" y="700" width="1800" height="900">
              <rect x="-300" y="700" width="1800" height="900" fill="#fff" />
              <path
                className="otter-anim-u"
                d="M231 726L236 764C288 870 420 926 584 927C748 926 880 870 932 764L937 726"
                fill="none"
                stroke="#000"
                strokeWidth="76"
                strokeLinecap="butt"
              />
            </mask>
          </defs>

          <g className="otter-anim-top">
            <path fill="#7b1fa2" fillRule="evenodd" clipPath={`url(#${ctId})`} d={OTTER_MAIN_PATH} />
            <g className="otter-anim-patch" fill="#7b1fa2" stroke="#7b1fa2" strokeWidth="5">
              <g mask={`url(#${meId})`}>
                <path d="M228 348C300 360 400 385 488 400C446 430 390 486 322 482C258 472 232 424 228 348Z" />
                <path d="M 939.2 348.0 C 867.2 360.0 767.2 385.0 679.2 400.0 C 721.2 430.0 777.2 486.0 845.2 482.0 C 909.2 472.0 935.2 424.0 939.2 348.0 Z" />
              </g>
              <g mask={`url(#${msId})`}>
                <path d="M488 400C462 480 346 560 282 690L258 690C326 560 436 476 470 412Z" />
                <path d="M 679.2 400.0 C 705.2 480.0 821.2 560.0 885.2 690.0 L 909.2 690.0 C 841.2 560.0 731.2 476.0 697.2 412.0 Z" />
              </g>
              <g mask={`url(#${mnId})`}>
                <path d="M470 600C470 565 520 548 584 548C648 548 698 565 698 600C690 650 635 688 584 690C533 688 478 650 470 600Z" />
              </g>
            </g>
          </g>

          <g className="otter-anim-bot">
            <path fill="#7b1fa2" fillRule="evenodd" clipPath={`url(#${cbId})`} d={OTTER_MAIN_PATH} />
            <g className="otter-anim-patch" mask={`url(#${mbId})`} fill="#7b1fa2" stroke="#7b1fa2" strokeWidth="5">
              <path d="M262 764C306 852 436 904 583.6 906C731.2 904 861.2 852 905.2 764L941.2 764C891.2 878 751.2 938 583.6 940C416 938 276 878 226 764Z" />
            </g>
          </g>
        </svg>
      </div>

      {/* Modern Glowing Progress Bar */}
      <div className="otter-bar" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}
