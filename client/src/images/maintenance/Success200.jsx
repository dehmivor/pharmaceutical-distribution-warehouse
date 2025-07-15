'use client';

// @mui
import { useTheme } from '@mui/material/styles';

/***************************  IMAGE - SUCCESS 200  ***************************/

export default function Success200() {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const successColor = theme.palette.success.main || '#4caf50';

  return (
    <svg viewBox="0 0 1207 399" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
      {/* Background decorative elements */}
      <g opacity="0.1">
        <circle cx="200" cy="100" r="60" fill={successColor} />
        <circle cx="1000" cy="300" r="40" fill={primaryColor} />
        <circle cx="100" cy="350" r="30" fill={successColor} />
      </g>

      {/* Main success checkmark circle */}
      <circle cx="603" cy="199" r="80" fill="none" stroke={successColor} strokeWidth="6" opacity="0.8" />

      {/* Checkmark */}
      <path d="M560 199L590 229L646 173" stroke={successColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Decorative curved lines */}
      <path
        d="M845.5 315H390.498C368.407 315 350.498 297.091 350.498 275V275C350.498 252.909 368.407 235 390.498 235H459.112C481.418 235 499.5 216.918 499.5 194.612V194.612C499.5 172.75 481.75 155.041 459.888 155.092L256 155.563"
        stroke={successColor}
        strokeOpacity="0.3"
        strokeWidth="4"
      />

      {/* Success indicators */}
      <g opacity="0.7">
        <circle cx="300" cy="150" r="6" fill={successColor} />
        <circle cx="320" cy="170" r="4" fill={successColor} />
        <circle cx="340" cy="140" r="5" fill={successColor} />
      </g>

      <g opacity="0.7">
        <circle cx="850" cy="120" r="6" fill={successColor} />
        <circle cx="870" cy="100" r="4" fill={successColor} />
        <circle cx="890" cy="130" r="5" fill={successColor} />
      </g>

      {/* Server/monitor representation */}
      <g opacity="0.6">
        <rect x="920" y="250" width="120" height="80" rx="8" fill="none" stroke={primaryColor} strokeWidth="3" strokeOpacity="0.5" />
        <circle cx="940" cy="270" r="4" fill={successColor} />
        <circle cx="955" cy="270" r="4" fill={successColor} />
        <circle cx="970" cy="270" r="4" fill={successColor} />
        <rect x="935" y="285" width="90" height="8" rx="2" fill={successColor} opacity="0.4" />
        <rect x="935" y="300" width="70" height="6" rx="2" fill={successColor} opacity="0.3" />
      </g>

      {/* Data flow representation */}
      <g opacity="0.5">
        <path
          d="M200 250L250 250C265 250 265 270 280 270L330 270"
          stroke={successColor}
          strokeWidth="3"
          strokeDasharray="10,5"
          fill="none"
        />
        <circle cx="340" cy="270" r="3" fill={successColor} />

        <path
          d="M400 180L450 180C465 180 465 200 480 200L530 200"
          stroke={successColor}
          strokeWidth="3"
          strokeDasharray="10,5"
          fill="none"
        />
        <circle cx="540" cy="200" r="3" fill={successColor} />
      </g>

      {/* Success badge */}
      <g opacity="0.8">
        <rect x="750" y="80" width="100" height="40" rx="20" fill={successColor} opacity="0.2" />
        <text x="800" y="105" textAnchor="middle" fill={successColor} fontSize="14" fontWeight="bold">
          200 OK
        </text>
      </g>

      {/* Celebration elements */}
      <g opacity="0.4">
        <path
          d="M150 80L155 70L160 80L170 75L165 85L175 90L165 95L170 105L160 100L155 110L150 100L140 105L145 95L135 90L145 85L140 75L150 80Z"
          fill={successColor}
        />
        <path
          d="M1050 320L1055 310L1060 320L1070 315L1065 325L1075 330L1065 335L1070 345L1060 340L1055 350L1050 340L1040 345L1045 335L1035 330L1045 325L1040 315L1050 320Z"
          fill={primaryColor}
        />
      </g>

      {/* Progress bars showing completion */}
      <g opacity="0.6">
        <rect x="400" y="320" width="200" height="8" rx="4" fill={primaryColor} opacity="0.2" />
        <rect x="400" y="320" width="200" height="8" rx="4" fill={successColor} opacity="0.6" />

        <rect x="400" y="340" width="150" height="6" rx="3" fill={primaryColor} opacity="0.2" />
        <rect x="400" y="340" width="150" height="6" rx="3" fill={successColor} opacity="0.6" />

        <rect x="400" y="355" width="180" height="6" rx="3" fill={primaryColor} opacity="0.2" />
        <rect x="400" y="355" width="180" height="6" rx="3" fill={successColor} opacity="0.6" />
      </g>

      {/* Cloud elements */}
      <g opacity="0.3">
        <ellipse cx="120" cy="60" rx="25" ry="15" fill={successColor} />
        <ellipse cx="105" cy="55" rx="20" ry="12" fill={successColor} />
        <ellipse cx="135" cy="55" rx="18" ry="10" fill={successColor} />

        <ellipse cx="1100" cy="80" rx="30" ry="18" fill={primaryColor} />
        <ellipse cx="1080" cy="75" rx="25" ry="15" fill={primaryColor} />
        <ellipse cx="1120" cy="75" rx="22" ry="12" fill={primaryColor} />
      </g>

      {/* Additional decorative elements */}
      <g opacity="0.2">
        <path d="M50 200Q100 180 150 200T250 200" stroke={successColor} strokeWidth="2" fill="none" />
        <path d="M950 150Q1000 130 1050 150T1150 150" stroke={primaryColor} strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
