'use client';

import React from 'react';

interface Props {
  size?: 'splash' | 'compact' | 'normal';
  idPrefix?: string;
  className?: string;
}

export default function OtterLoadingAnimation({
  size = 'normal',
  idPrefix = 'otter',
  className = '',
}: Props) {
  const topId = `${idPrefix}-t`;
  const botId = `${idPrefix}-b`;
  const shapeId = `${idPrefix}-shape`;
  const gradId = `${idPrefix}-g`;
  const maskSId = `${idPrefix}-ms`;
  const maskLId = `${idPrefix}-ml`;

  const sizeClasses =
    size === 'splash'
      ? 'w-[min(54vw,220px)] sm:w-[220px]'
      : size === 'compact'
      ? 'w-[140px] sm:w-[160px]'
      : 'w-[min(48vw,190px)] sm:w-[190px]';

  return (
    <div
      className={`otter-loading-wrap flex flex-col items-center justify-center gap-6 sm:gap-7 select-none ${className}`}
      role="img"
      aria-label="Carregando Otterfy"
    >
      <svg
        viewBox="20 20 1128 1250"
        className={`${sizeClasses} h-auto overflow-visible transition-transform`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path
            id={topId}
            d="M340 776C337 776 335 772 335 768C335 767 333 761 330 756C320 737 316 724 315 707C314 688 328 691 212 690C157 690 112 689 111 689C107 686 107 692 107 526C108 370 108 370 106 366C104 364 98 358 92 352C77 338 66 325 55 305C31 263 41 207 76 188C89 181 94 180 129 179C171 178 180 176 212 162C232 153 246 145 266 132C324 92 391 64 453 54C460 53 470 51 474 50C529 41 615 39 670 47C736 56 764 63 817 84C832 90 862 105 875 114C879 116 884 119 886 120C889 121 895 125 900 129C920 143 924 145 941 154C983 175 990 177 1035 178C1051 179 1068 179 1071 180C1118 187 1140 240 1119 295C1111 313 1094 337 1075 354C1069 359 1064 364 1063 365C1061 368 1061 371 1061 526C1061 684 1061 684 1059 687C1056 690 1056 690 956 690C864 690 856 691 854 692C853 694 853 696 852 707C852 716 852 722 850 726C846 740 841 753 838 759C835 763 834 766 834 768C834 777 843 776 729 776C617 776 625 777 625 769C625 767 624 765 614 757C608 752 606 749 603 737C600 727 599 707 602 702C607 693 602 690 584 690C568 690 565 692 567 698C567 700 567 708 568 715C568 737 563 750 550 760C547 763 544 766 544 768C542 773 540 775 538 776C535 777 344 777 340 776Z"
          />
          <path
            id={botId}
            d="M554 1248C461 1240 378 1208 303 1152C244 1108 192 1047 161 984C138 938 122 890 116 852C116 846 114 839 114 837C109 813 107 773 110 768C113 766 113 766 581 765C838 765 1050 765 1053 766C1059 766 1061 770 1060 779C1054 856 1044 905 1021 957C1018 962 1015 969 1014 973C1011 979 992 1013 984 1025C961 1062 925 1102 890 1133C871 1148 847 1167 833 1175C779 1208 726 1229 666 1241C657 1243 650 1244 620 1247C608 1248 566 1249 554 1248Z"
          />
          <clipPath id={shapeId}>
            <use href={`#${topId}`} />
            <use href={`#${botId}`} />
          </clipPath>
          <linearGradient id={gradId} x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={maskSId} maskUnits="userSpaceOnUse" x="0" y="0" width="1300" height="1400">
            <g transform="scale(4)">
              <path className="otter-draw otter-d1" pathLength="1" d="M118 97C108 112 98 125 90 138S72 162 68 178" />
            </g>
          </mask>
          <mask id={maskLId} maskUnits="userSpaceOnUse" x="0" y="0" width="1300" height="1400">
            <g transform="scale(4)">
              <path className="otter-draw otter-d2" pathLength="1" d="M60 188C70 207 95 221 125 227L150 229" />
              <path className="otter-draw otter-d2" pathLength="1" d="M94 193C110 198 130 192 150 189" />
              <g transform="translate(291.8 0) scale(-1 1)">
                <path className="otter-draw otter-d2" pathLength="1" d="M60 188C70 207 95 221 125 227L150 229" />
                <path className="otter-draw otter-d2" pathLength="1" d="M94 193C110 198 130 192 150 189" />
              </g>
            </g>
          </mask>
        </defs>

        <use className="otter-ink otter-top" href={`#${topId}`} />
        <use className="otter-ink otter-bot" href={`#${botId}`} />
        <g clipPath={`url(#${shapeId})`}>
          <rect className="otter-shine" x="-200" y="0" width="360" height="1332" fill={`url(#${gradId})`} />
        </g>
        <g className="otter-face">
          <path
            className="otter-cut"
            d="M276 689C279 688 280 685 283 674C292 637 307 615 352 571C360 562 369 552 372 550C374 547 378 542 380 539C396 522 407 488 400 480C398 478 398 478 386 482C379 484 374 486 374 485C374 483 412 431 413 431C414 431 417 432 421 433C440 439 453 433 466 414C478 396 481 404 474 432C468 455 452 492 442 506C440 508 436 514 434 517C426 531 409 551 386 574C370 590 350 613 341 628C331 642 318 672 316 685L316 690L295 690C281 690 274 690 276 689Z"
            mask={`url(#${maskSId})`}
          />
          <g transform="translate(1167.2 0) scale(-1 1)">
            <path
              className="otter-cut"
              d="M276 689C279 688 280 685 283 674C292 637 307 615 352 571C360 562 369 552 372 550C374 547 378 542 380 539C396 522 407 488 400 480C398 478 398 478 386 482C379 484 374 486 374 485C374 483 412 431 413 431C414 431 417 432 421 433C440 439 453 433 466 414C478 396 481 404 474 432C468 455 452 492 442 506C440 508 436 514 434 517C426 531 409 551 386 574C370 590 350 613 341 628C331 642 318 672 316 685L316 690L295 690C281 690 274 690 276 689Z"
              mask={`url(#${maskSId})`}
            />
          </g>
          <path
            className="otter-cut"
            d="M570 920C554 919 546 918 535 915C510 909 483 899 462 887C450 880 450 880 428 879C398 878 388 876 362 867C341 860 314 843 301 828C284 809 271 790 266 778C263 770 261 767 256 766C255 766 270 765 294 765L335 765L338 770C359 798 394 814 425 809C444 806 506 783 535 768C542 765 542 765 584 765L626 765L637 770C647 775 676 787 700 796C725 806 750 811 765 809C790 806 820 787 832 768C833 765 833 765 873 765C908 765 912 765 910 767C908 767 906 770 904 774C898 788 895 794 891 799C888 802 884 808 880 813C848 856 802 877 741 879C718 880 718 880 711 884C704 889 696 893 690 896C688 896 682 899 676 901C642 915 599 923 570 920ZM612 878C621 877 631 874 644 870C654 867 663 864 663 864C666 864 684 855 692 850C709 839 710 835 698 830C694 829 684 825 676 822C664 817 648 811 631 807C593 796 544 800 500 819C494 821 484 825 478 828C461 834 460 835 468 844C477 853 488 859 520 869C554 880 581 883 612 878Z"
            fillRule="evenodd"
            mask={`url(#${maskLId})`}
          />
          <path
            className="otter-cut otter-pop"
            d="M545 686C534 680 534 679 534 666C536 645 528 632 513 627C502 624 497 630 502 640C514 663 503 668 483 648C454 619 459 587 495 572C498 571 504 569 507 568C527 559 550 555 579 554C615 553 653 562 682 577C709 591 712 619 689 643C666 667 656 668 666 644C673 629 668 623 653 627C639 632 634 644 635 667C635 679 634 680 623 686C611 692 557 692 545 686Z"
          />
          <path
            className="otter-cut otter-eye"
            d="M339 488C311 485 287 468 273 442C266 429 264 415 268 394C270 379 268 375 256 369C237 358 228 352 228 350C228 344 251 345 274 351C297 358 321 370 350 391C357 396 369 404 377 409C385 414 394 420 398 423C402 425 407 428 411 430L418 433L400 458C383 482 383 482 377 485C367 489 354 490 339 488Z"
          />
          <g transform="translate(1167.2 0) scale(-1 1)">
            <path
              className="otter-cut otter-eye"
              d="M339 488C311 485 287 468 273 442C266 429 264 415 268 394C270 379 268 375 256 369C237 358 228 352 228 350C228 344 251 345 274 351C297 358 321 370 350 391C357 396 369 404 377 409C385 414 394 420 398 423C402 425 407 428 411 430L418 433L400 458C383 482 383 482 377 485C367 489 354 490 339 488Z"
            />
          </g>
        </g>
      </svg>
      <div className="otter-bar" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}
