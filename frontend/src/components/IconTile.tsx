import { Center } from "@chakra-ui/react";
import type { ElementType } from "react";

interface IIconTileProps {
  icone: ElementType;
  size?: string;
  iconSize?: string;
  backgroundColor?: string;
  iconColor?: string;
  borderRadius?: string;
  ring?: boolean;
}
export function IconTile({
  icone: IconeElement,
  size = "48px",
  iconSize = "24px",
  backgroundColor = "#fff",
  iconColor = "#000",
  borderRadius = "16px",
  ring = false,
}: IIconTileProps) {
  return (
    <Center
      boxSize={size}
      flexShrink={0}
      bg={backgroundColor}
      rounded={borderRadius}
      {...(ring && {
        borderWidth: "4px",
        borderStyle: "solid",
        borderColor: "#fff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)",
      })}
    >
      <IconeElement size={iconSize} color={iconColor} />
    </Center>
  );
}
