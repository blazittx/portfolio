import { useState } from "react";
import { GAME_IDS } from "../constants/games";
import {
  snapToGrid,
  snapSizeToGrid,
  constrainToViewport,
  gridToPixels,
  pixelsToGrid,
} from "../utils/grid";
import { getWidgetMinSize } from "../constants/grid";
import { GRID_OFFSET_X, GRID_OFFSET_Y } from "../constants/grid";
import {
  DEFAULT_HOMEPAGE_LAYOUT,
  DEFAULT_HOMEPAGE_LAYOUT_MOBILE,
} from "../utils/setDefaultLayouts";
import { isMobile } from "../utils/mobile";
import ProfileWidget from "../components/widgets/ProfileWidget";
import AboutWidget from "../components/widgets/AboutWidget";
import SkillsWidget from "../components/widgets/SkillsWidget";
import ContactWidget from "../components/widgets/ContactWidget";
import GamesWidget from "../components/widgets/GamesWidget";
import VisitorsWidget from "../components/widgets/VisitorsWidget";
import MessageOfTheDayWidget from "../components/widgets/MessageOfTheDayWidget";
import TimeWidget from "../components/widgets/TimeWidget";
import GitHubActivityWidget from "../components/widgets/GitHubActivityWidget";
import ApiKeyWidget from "../components/widgets/ApiKeyWidget";
import SingleGameWidget from "../components/widgets/SingleGameWidget";
import ProfilePictureWidget from "../components/widgets/ProfilePictureWidget";
import HeartbeatWidget from "../components/widgets/HeartbeatWidget";
import CVWidget from "../components/widgets/CVWidget";

// Component mapping - exported for use in other components
export const componentMap = {
  profile: ProfileWidget,
  about: AboutWidget,
  skills: SkillsWidget,
  contact: ContactWidget,
  games: GamesWidget,
  visitors: VisitorsWidget,
  motd: MessageOfTheDayWidget,
  time: TimeWidget,
  github: GitHubActivityWidget,
  apikey: ApiKeyWidget,
  "single-game": SingleGameWidget,
  "profile-picture": ProfilePictureWidget,
  heartbeat: HeartbeatWidget,
  cv: CVWidget,
};

export const buildWidgetsFromLayout = (layout, { mobile = isMobile() } = {}) =>
  layout
    .map((widget) => {
      try {
        const hasGridUnits =
          typeof widget.col === "number" && typeof widget.row === "number";
        const baseGrid = hasGridUnits
          ? { col: widget.col, row: widget.row, w: widget.w, h: widget.h }
          : pixelsToGrid({
              x: widget.x,
              y: widget.y,
              width: widget.width,
              height: widget.height,
            });
        const basePixels = gridToPixels(baseGrid);
        const constrainedPos = mobile
          ? constrainToViewport(
              basePixels.x,
              basePixels.y,
              basePixels.width,
              basePixels.height,
              { x: 0, y: 0 },
              false
            )
          : { x: basePixels.x, y: basePixels.y };

        // Always use widget.type to look up component (not widget.id, which may have suffixes like -1, -2)
        const component = componentMap[widget.type];

        // Only include widgets with valid components
        if (!component) {
          console.warn(
            `Widget component not found for type: ${widget.type}, id: ${widget.id}`
          );
          return null;
        }

        // Initialize default settings for widgets that need them
        let settings = widget.settings || {};
        if (
          widget.type === "single-game" &&
          (!settings.gameId || !GAME_IDS.includes(settings.gameId))
        ) {
          settings = { gameId: GAME_IDS[0] };
        }
        // Preserve EXACT saved sizes and positions - don't modify them at all
        // Only ensure they're valid numbers
        const finalWidth =
          typeof basePixels.width === "number" && basePixels.width > 0
            ? basePixels.width
            : getWidgetMinSize(widget.type).width;
        const finalHeight =
          typeof basePixels.height === "number" && basePixels.height > 0
            ? basePixels.height
            : getWidgetMinSize(widget.type).height;

        return {
          ...widget,
          x: constrainedPos.x,
          y: constrainedPos.y,
          width: finalWidth,
          height: finalHeight,
          col: baseGrid.col,
          row: baseGrid.row,
          w: baseGrid.w,
          h: baseGrid.h,
          component: component,
          locked: widget.locked || false,
          pinned: widget.pinned || false,
          settings: settings,
        };
      } catch (error) {
        console.error(`Error creating widget ${widget.id}:`, error);
        return null;
      }
    })
    .filter((widget) => widget !== null);

export const useWidgets = (view = "main") => {
  const mobile = isMobile();

  // Initialize widget positions from default layouts
  const [widgets, setWidgets] = useState(() => {
    // For game-detail and cv-detail views, return empty array - let their respective views handle initialization
    if (view === "game-detail" || view === "cv-detail") {
      return [];
    }

    try {
      const layoutToUse = mobile
        ? DEFAULT_HOMEPAGE_LAYOUT_MOBILE
        : DEFAULT_HOMEPAGE_LAYOUT;
      return buildWidgetsFromLayout(layoutToUse, { mobile });
    } catch (error) {
      console.error("Error creating default widget layout:", error);
      // Return minimal safe layout
      return [
        {
          id: "profile",
          type: "profile",
          x: snapToGrid(100, GRID_OFFSET_X),
          y: snapToGrid(100, GRID_OFFSET_Y),
          width: snapSizeToGrid(270),
          height: snapSizeToGrid(180),
          component: ProfileWidget,
          locked: false,
          pinned: false,
        },
      ];
    }
  });

  return [widgets, setWidgets];
};
