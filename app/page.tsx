"use client"

import "./styles.css";
import { Reorder } from 'framer-motion';
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react';
import { Item } from './Item';

const initialItems = ["🍅 Tomato", "🥒 Cucumber", "🧀 Cheese", "🥬 Lettuce"];

export default function Home() {
  const [items, setItems] = useState(initialItems);

  return (
    <Reorder.Group axis="y" onReorder={setItems} values={items}>
      {items.map((item) => (
        <Item key={item} item={item} />
      ))}
    </Reorder.Group>
  );
}
