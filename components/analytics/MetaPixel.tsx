'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID!;

export default function MetaPixel() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        ReactPixel.init(PIXEL_ID, undefined, {
            autoConfig: true,
            debug: false,
        });
        ReactPixel.pageView();
    }, []);

    useEffect(() => {
        ReactPixel.pageView();
    }, [pathname, searchParams]);

    return null;
}