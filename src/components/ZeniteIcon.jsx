import Ban from 'lucide-react/dist/esm/icons/ban.mjs';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs';
import CircleMinus from 'lucide-react/dist/esm/icons/circle-minus.mjs';
import CirclePlus from 'lucide-react/dist/esm/icons/circle-plus.mjs';
import Clock from 'lucide-react/dist/esm/icons/clock.mjs';
import Ellipsis from 'lucide-react/dist/esm/icons/ellipsis.mjs';
import Menu from 'lucide-react/dist/esm/icons/menu.mjs';
import Moon from 'lucide-react/dist/esm/icons/moon.mjs';
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Rocket from 'lucide-react/dist/esm/icons/rocket.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import Sun from 'lucide-react/dist/esm/icons/sun.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import Save from 'lucide-react/dist/esm/icons/save.mjs';
import Arrowleft from 'lucide-react/dist/esm/icons/arrow-left.mjs';

const ICONS = {
    ban: Ban,
    check: CircleCheck,
    clock: Clock,
    ellipsis: Ellipsis,
    menu: Menu,
    moon: Moon,
    minus: CircleMinus,
    pencil: Pencil,
    plus: CirclePlus,
    rocket: Rocket,
    search: Search,
    sun: Sun,
    save: Save,
    trash: Trash2,
    'arrow-left': Arrowleft
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