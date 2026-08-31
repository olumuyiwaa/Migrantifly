import type { ComponentType, SVGProps } from 'react';

// Import all SVGs
import PlusIconSvg from './plus.svg';
import CloseIconSvg from './close.svg';
import CheckCircleIconSvg from './check-circle.svg';
import AlertIconSvg from './alert.svg';
import InfoIconSvg from './info.svg';
import ErrorIconSvg from './info-hexa.svg';
import BoltIconSvg from './bolt.svg';
import ArrowUpIconSvg from './arrow-up.svg';
import ArrowDownIconSvg from './arrow-down.svg';
import FolderIconSvg from './folder.svg';
import VideoIconSvg from './videos.svg';
import AudioIconSvg from './audio.svg';
import GridIconSvg from './grid.svg';
import FileIconSvg from './file.svg';
import DownloadIconSvg from './download.svg';
import ArrowRightIconSvg from './arrow-right.svg';
import GroupIconSvg from './group.svg';
import BoxIconLineSvg from './box-line.svg';
import ShootingStarIconSvg from './shooting-star.svg';
import DollarLineIconSvg from './dollar-line.svg';
import TrashBinIconSvg from './trash.svg';
import AngleUpIconSvg from './angle-up.svg';
import AngleDownIconSvg from './angle-down.svg';
import PencilIconSvg from './pencil.svg';
import CheckLineIconSvg from './check-line.svg';
import CloseLineIconSvg from './close-line.svg';
import ChevronDownIconSvg from './chevron-down.svg';
import ChevronUpIconSvg from './chevron-up.svg';
import PaperPlaneIconSvg from './paper-plane.svg';
import LockIconSvg from './lock.svg';
import EnvelopeIconSvg from './envelope.svg';
import UserIconSvg from './user-line.svg';
import CalenderIconSvg from './calender-line.svg';
import EyeIconSvg from './eye.svg';
import EyeCloseIconSvg from './eye-close.svg';
import TimeIconSvg from './time.svg';
import CopyIconSvg from './copy.svg';
import ChevronLeftIconSvg from './chevron-left.svg';
import UserCircleIconSvg from './user-circle.svg';
import TaskIconSvg from './task-icon.svg';
import ListIconSvg from './list.svg';
import TableIconSvg from './table.svg';
import PageIconSvg from './page.svg';
import PieChartIconSvg from './pie-chart.svg';
import BoxCubeIconSvg from './box-cube.svg';
import PlugInIconSvg from './plug-in.svg';
import DocsIconSvg from './docs.svg';
import MailIconSvg from './mail-line.svg';
import HorizontaLDotsSvg from './horizontal-dots.svg';
import ChatIconSvg from './chat.svg';
import MoreDotIconSvg from './more-dot.svg';
import BellIconSvg from './bell.svg';
import HeartSvg from './heart.svg';
import TrackingIcon from './tracking.svg';
import briefcaseSvg from './briefcase.svg';
import ApplicationSvg from './applications.svg';
import TransactionsSvg from './transactions.svg';

/**
 * Common props accepted by all icons.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number;
}

/**
 * Create a consistent icon component.
 */
const createIcon = (
    Icon: ComponentType<SVGProps<SVGSVGElement>>
): ComponentType<IconProps> => {
    const IconComponent = ({
                               size = 22,
                               width,
                               height,
                               ...props
                           }: IconProps) => {
        return (
            <Icon
                width={width ?? size}
                height={height ?? size}
                {...props}
            />
        );
    };

    IconComponent.displayName = 'Icon';

    return IconComponent;
};

/**
 * Export icons.
 */
export const PlusIcon = createIcon(PlusIconSvg);
export const CloseIcon = createIcon(CloseIconSvg);
export const CheckCircleIcon = createIcon(CheckCircleIconSvg);
export const AlertIcon = createIcon(AlertIconSvg);
export const InfoIcon = createIcon(InfoIconSvg);
export const ErrorIcon = createIcon(ErrorIconSvg);
export const BoltIcon = createIcon(BoltIconSvg);
export const ArrowUpIcon = createIcon(ArrowUpIconSvg);
export const ArrowDownIcon = createIcon(ArrowDownIconSvg);
export const FolderIcon = createIcon(FolderIconSvg);
export const VideoIcon = createIcon(VideoIconSvg);
export const AudioIcon = createIcon(AudioIconSvg);
export const GridIcon = createIcon(GridIconSvg);
export const FileIcon = createIcon(FileIconSvg);
export const DownloadIcon = createIcon(DownloadIconSvg);
export const ArrowRightIcon = createIcon(ArrowRightIconSvg);
export const GroupIcon = createIcon(GroupIconSvg);
export const BoxIconLine = createIcon(BoxIconLineSvg);
export const ShootingStarIcon = createIcon(ShootingStarIconSvg);
export const DollarLineIcon = createIcon(DollarLineIconSvg);
export const TrashBinIcon = createIcon(TrashBinIconSvg);
export const AngleUpIcon = createIcon(AngleUpIconSvg);
export const AngleDownIcon = createIcon(AngleDownIconSvg);
export const PencilIcon = createIcon(PencilIconSvg);
export const CheckLineIcon = createIcon(CheckLineIconSvg);
export const CloseLineIcon = createIcon(CloseLineIconSvg);
export const ChevronDownIcon = createIcon(ChevronDownIconSvg);
export const ChevronUpIcon = createIcon(ChevronUpIconSvg);
export const PaperPlaneIcon = createIcon(PaperPlaneIconSvg);
export const EnvelopeIcon = createIcon(EnvelopeIconSvg);
export const LockIcon = createIcon(LockIconSvg);
export const UserIcon = createIcon(UserIconSvg);
export const CalenderIcon = createIcon(CalenderIconSvg);
export const EyeIcon = createIcon(EyeIconSvg);
export const EyeCloseIcon = createIcon(EyeCloseIconSvg);
export const TimeIcon = createIcon(TimeIconSvg);
export const CopyIcon = createIcon(CopyIconSvg);
export const ChevronLeftIcon = createIcon(ChevronLeftIconSvg);
export const UserCircleIcon = createIcon(UserCircleIconSvg);
export const ListIcon = createIcon(ListIconSvg);
export const TableIcon = createIcon(TableIconSvg);
export const PageIcon = createIcon(PageIconSvg);
export const TaskIcon = createIcon(TaskIconSvg);
export const PieChartIcon = createIcon(PieChartIconSvg);
export const BoxCubeIcon = createIcon(BoxCubeIconSvg);
export const PlugInIcon = createIcon(PlugInIconSvg);
export const DocsIcon = createIcon(DocsIconSvg);
export const MailIcon = createIcon(MailIconSvg);
export const HorizontaLDots = createIcon(HorizontaLDotsSvg);
export const ChatIcon = createIcon(ChatIconSvg);
export const MoreDotIcon = createIcon(MoreDotIconSvg);
export const BellIcon = createIcon(BellIconSvg);
export const Tracking = createIcon(TrackingIcon);
export const HeartIcon = createIcon(HeartSvg);
export const BriefcaseIcon  = createIcon(briefcaseSvg);
export const ApplicationIcon  = createIcon(ApplicationSvg);
export const TransactionsIcon  = createIcon(TransactionsSvg);