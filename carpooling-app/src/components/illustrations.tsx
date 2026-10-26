import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * Vector versions of the campus artwork, so they stay sharp on every screen
 * size. Coordinates follow the original 456px-wide mock-up.
 */

const C = {
  hillRed: '#BF1414',
  hillRedLight: '#E8463F',
  hillBrown: '#B65B42',
  road: '#F5F5F5',
  trunk: '#1F1A1A',
  pink: '#DC5F7E',
  rust: '#B4542C',
  orange: '#E26A2C',
  tallOrange: '#D04E22',
  magenta: '#E66A9C',
  facade: '#F05A55',
  facadeSide: '#E84843',
  wingDark: '#9E1717',
  roof: '#C44A2E',
  window: '#2B1D1D',
};

type Blob = [cx: number, cy: number, r: number];

/** A tree crown built from overlapping circles, with a tapered trunk. */
function Tree({ crown, color, trunk }: { crown: Blob[]; color: string; trunk: string }) {
  return (
    <G>
      <Path d={trunk} fill={C.trunk} />
      {crown.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </G>
  );
}

function windowGrid(x0: number, y0: number, cols: number, rows: number, dx: number, dy: number, w: number, h: number) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push(<Rect key={`${r}-${c}`} x={x0 + c * dx} y={y0 + r * dy} width={w} height={h} fill={C.window} />);
    }
  }
  return out;
}

/** Splash screen: campus building, winding roads and autumn trees. */
export function CampusScene({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.campus, style]}>
      <Svg width="100%" height="100%" viewBox="0 515 456 509" preserveAspectRatio="xMidYMax slice">
        {/* Building (drawn first so the hill overlaps its base) */}
        <Rect x={58} y={640} width={26} height={52} fill={C.wingDark} />
        {windowGrid(64, 652, 2, 2, 9, 18, 5, 9)}
        <Rect x={148} y={636} width={72} height={56} fill={C.facadeSide} />
        <Rect x={146} y={632} width={76} height={5} fill={C.roof} />
        {windowGrid(156, 648, 4, 2, 16, 20, 8, 11)}
        <Rect x={82} y={598} width={68} height={94} fill={C.facade} />
        <Path d="M78,600 L116,574 L154,600 Z" fill={C.roof} />
        <Rect x={78} y={598} width={76} height={4} fill={C.roof} />
        {windowGrid(91, 614, 3, 3, 18, 21, 9, 12)}
        <Path d="M109,692 L109,680 A7,7 0 0 1 123,680 L123,692 Z" fill={C.window} />

        {/* Trees behind the hill line */}
        <Tree
          color={C.pink}
          crown={[[18, 600, 24], [40, 590, 20], [50, 614, 20], [32, 632, 24], [8, 628, 22], [24, 572, 16], [4, 590, 18]]}
          trunk="M19,640 L23,640 L25,732 L17,732 Z"
        />
        <Tree
          color={C.tallOrange}
          crown={[]}
          trunk="M384,612 L388,612 L390,686 L382,686 Z"
        />
        <Ellipse cx={386} cy={582} rx={40} ry={66} fill={C.tallOrange} />
        <Tree
          color={C.magenta}
          crown={[[432, 602, 14], [447, 592, 14], [458, 612, 16], [442, 624, 14], [428, 616, 12]]}
          trunk="M439,618 L442,618 L443,680 L437,680 Z M440,640 L431,628 L433,626 L441,636 Z M441,646 L450,634 L452,636 L442,650 Z"
        />

        {/* Hills */}
        <Path d="M0,688 L456,688 L456,1024 L0,1024 Z" fill={C.hillRed} />
        <Path
          d="M326,690 C376,684 420,668 456,652 L456,1024 L246,1024 C335,965 397,895 417,822 C432,770 425,716 380,698 C362,692 344,690 326,690 Z"
          fill={C.hillBrown}
        />

        {/* Roads */}
        <Path
          d="M-10,683 C100,685 200,693 245,705 C285,716 292,760 262,782 C215,815 110,860 0,898 L0,876 C105,840 200,800 240,770 C262,752 258,725 235,719 C190,708 100,700 -10,699 Z"
          fill={C.road}
        />
        <Path
          d="M262,684 C305,682 345,684 380,698 C425,716 432,770 417,822 C397,895 335,965 248,1030 L214,1030 C305,958 370,890 388,818 C402,768 396,728 366,713 C334,698 300,696 262,698 Z"
          fill={C.road}
        />

        {/* Trees on the crest */}
        <Tree
          color={C.rust}
          crown={[[254, 652, 16], [271, 641, 16], [288, 654, 15], [286, 674, 15], [262, 676, 16], [245, 668, 13], [270, 662, 18]]}
          trunk="M266,666 L270,666 L270,694 L266,694 Z M268,684 L276,678 L277,680 L269,688 Z"
        />
        <Tree
          color={C.orange}
          crown={[[318, 630, 13], [333, 622, 14], [345, 637, 12], [333, 650, 14], [315, 646, 12], [327, 637, 15]]}
          trunk="M323,645 L331,645 L333,692 L321,692 Z M326,656 L314,650 L315,647 L327,652 Z M328,656 L340,649 L341,652 L329,659 Z"
        />
      </Svg>
    </View>
  );
}

/** Login screen footer: a red hill with three trees. */
export function HillsScene({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.hills, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 458 250" preserveAspectRatio="xMidYMax slice">
        <Tree
          color={C.pink}
          crown={[[28, 62, 22], [44, 84, 26], [54, 112, 24], [38, 136, 26], [12, 130, 24], [8, 98, 24], [28, 102, 30], [16, 70, 20]]}
          trunk="M31,120 L35,120 L38,206 L28,206 Z"
        />
        <Tree
          color={C.rust}
          crown={[[306, 100, 16], [323, 90, 17], [342, 102, 16], [348, 124, 15], [330, 138, 16], [306, 132, 16], [298, 116, 14], [324, 116, 20]]}
          trunk="M321,128 L325,128 L326,166 L320,166 Z M323,140 L332,132 L333,134 L324,144 Z"
        />
        <Tree
          color={C.orange}
          crown={[[392, 122, 14], [408, 112, 14], [422, 126, 13], [416, 146, 14], [396, 146, 14], [405, 132, 16]]}
          trunk="M399,140 L409,140 L411,188 L397,188 Z M402,150 L390,143 L391,140 L403,147 Z M406,150 L419,143 L420,146 L407,153 Z"
        />
        <Path d="M0,192 C120,150 340,150 458,192 L458,250 L0,250 Z" fill={C.hillRedLight} />
      </Svg>
    </View>
  );
}

/** App logo: white car on a red tile. Deliberately plain (no university crest). */
export function LogoTile({ size = 112 }: { size?: number }) {
  const red = '#D12C2C';
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.2, backgroundColor: red }]}>
      <Svg width={size * 0.72} height={size * 0.46} viewBox="0 0 100 64">
        <Path
          d="M6,46 L6,34 C6,30 8,28 12,27 L20,25 L30,11 C31.5,9 33.5,8 36,8 L62,8 C65,8 67,9 69,11 L80,25 L88,27 C92,28 94,31 94,35 L94,46 C94,48 92.5,49 90.5,49 L9.5,49 C7.5,49 6,48 6,46 Z"
          fill="#FFFFFF"
        />
        <Path d="M34,13 L47,13 L47,25 L25.5,25 Z" fill={red} />
        <Path d="M51,13 L62.5,13 C64,13 65,13.5 66,14.5 L75,25 L51,25 Z" fill={red} />
        <Circle cx={26} cy={49} r={10.5} fill={red} />
        <Circle cx={26} cy={49} r={7.5} fill="#FFFFFF" />
        <Circle cx={74} cy={49} r={10.5} fill={red} />
        <Circle cx={74} cy={49} r={7.5} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Keep the mock-up's proportions; on short screens `maxHeight` kicks in and
  // the drawing crops at the sides instead of squashing.
  campus: { width: '100%', aspectRatio: 456 / 509 },
  hills: { width: '100%', aspectRatio: 458 / 250 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
