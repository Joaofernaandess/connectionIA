import CircleMinus from 'lucide-react/dist/esm/icons/circle-minus.mjs';
import CirclePlus from 'lucide-react/dist/esm/icons/circle-plus.mjs';
import Menu from 'lucide-react/dist/esm/icons/menu.mjs';
import Moon from 'lucide-react/dist/esm/icons/moon.mjs';
import Rocket from 'lucide-react/dist/esm/icons/rocket.mjs';
import Sun from 'lucide-react/dist/esm/icons/sun.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';

const ICONS = {
    menu: Menu,
    moon: Moon,
    minus: CircleMinus,
    plus: CirclePlus,
    rocket: Rocket,
    sun: Sun,
    trash: Trash2
};

export default function ZeniteIcon({ name, className = '', size = 20, strokeWidth = 2.25 }) {
    const Icon = ICONS[name];

    if (!Icon) return null;

    return (
        <Icon
            aria-hidden="true"
            className={className}
            size={size}
            strokeWidth={strokeWidth}
        />
    );
}