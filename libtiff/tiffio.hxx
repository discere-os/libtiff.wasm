/*
 * Copyright (c) 1988-1997 Sam Leffler
 * Copyright (c) 1991-1997 Silicon Graphics, Inc.
 *
 * Permission to use, copy, modify, distribute, and sell this software and
 * its documentation for any purpose is hereby granted without fee, provided
 * that (i) the above copyright notices and this permission notice appear in
 * all copies of the software and related documentation, and (ii) the names of
 * Sam Leffler and Silicon Graphics may not be used in any advertising or
 * publicity relating to the software without the specific, prior written
 * permission of Sam Leffler and Silicon Graphics.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL SAM LEFFLER OR SILICON GRAPHICS BE LIABLE FOR
 * ANY SPECIAL, INCIDENTAL, INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND,
 * OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
 * WHETHER OR NOT ADVISED OF THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF
 * LIABILITY, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
 * OF THIS SOFTWARE.
 */

#ifndef _TIFFIO_HXX_
#define _TIFFIO_HXX_

/*
 * TIFF I/O library definitions which provide C++ streams API.
 */

#include "tiff.h"
#include "tiffio.h"
#include <cassert>
#include <cstddef>
#include <iostream>
#include <limits>
#include <memory>
#include <new>

extern TIFF *TIFFStreamOpen(const char *, std::ostream *);
extern TIFF *TIFFStreamOpen(const char *, std::istream *);

namespace LibTIFF
{

#ifndef TIFF_DISABLE_STL_ALLOCATOR // provide easy way to disable

#if __cplusplus >= 201103 // needs c++ 11 for "auto"

#ifdef __has_cpp_attribute
#if __has_cpp_attribute(nodiscard)
#define TIFF_NODISCARD [[nodiscard]]
#else
#define TIFF_NODISCARD
#endif
#if __has_cpp_attribute(maybe_unused)
#define TIFF_MAYBE_UNUSED [[maybe_unused]]
#else
#define TIFF_MAYBE_UNUSED
#endif
#else
#define TIFF_NODISCARD
#define TIFF_MAYBE_UNUSED
#endif

// Simple allocator class for use with C++ STL. This allows for the use of STL
// containers such as std::vector and std:array using memory managed by
// _TIFFmalloc and _TIFFfree
template <typename T> class allocator : public std::allocator<T>
{
  public:
    TIFF_NODISCARD auto allocate(std::size_t n) -> T *
    {
        assert(n > 0); // n == 0 is undefined behaviour

        // An allocator function is required to throw this exception.
        // This is a bit redundant with the bellow check against the max
        // size of tmsize_t, however the c++ spec specifically says that
        // this check must be done.
        if (std::numeric_limits<std::size_t>::max() / sizeof(T) < n)
            throw std::bad_array_new_length{};

        // since _TIFFmalloc takes a tmsize_t, instead of a std::size_t,
        // we need to check that it will not overflow
        if (std::numeric_limits<tmsize_t>::max() < sizeof(T) * n)
            throw std::bad_array_new_length{};

        const auto size = static_cast<tmsize_t>(n) * sizeof(T);

        // This should be impossible, since an exception should have
        // been thrown in case of an overflow
        assert(size >= n);

        if (auto ptr = static_cast<T *>(_TIFFmalloc(size)))
            return ptr;

        throw std::bad_alloc{};
    }

#ifdef __cpp_lib_allocate_at_least
    TIFF_NODISCARD auto allocate_at_least(std::size_t n)
        -> std::allocation_result<T *, std::size_t>
    {
        // Just allocate the exact amount that was requested
        return {allocate(n), n};
    }
#endif // __cpp_lib_allocate_at_least

    auto deallocate(T *p, TIFF_MAYBE_UNUSED std::size_t) -> void
    {
        _TIFFfree(p);
    }
};

#define TIFF_HAS_STL_ALLOCATOR 1 // Macro for feature check

#endif // __c_plus_plus > 201103

#endif // ! TIFF_DISABLE_STL_ALLOCATOR

} // namespace LibTIFF

#endif /* _TIFFIO_HXX_ */
