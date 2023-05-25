import type { ReactNode } from "react";

export default function Layout(props: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div>
      {props.children}
      {props.modal}
    </div>
  );
}