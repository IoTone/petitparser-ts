;; constructors / accessors
(define make-state
  (lambda (board sh gh stm mn hist)
    (list board sh gh stm mn hist)))

(define state-board       (lambda (s) (car s)))
(define state-sente-hand  (lambda (s) (car (cdr s))))
(define state-gote-hand   (lambda (s) (car (cdr (cdr s)))))
(define state-stm         (lambda (s) (car (cdr (cdr (cdr s))))))
(define state-move-num    (lambda (s) (car (cdr (cdr (cdr (cdr s)))))))
(define state-history     (lambda (s) (car (cdr (cdr (cdr (cdr (cdr s))))))))

;; Boolean glue (the dialect lacks and/or).
(define and2 (lambda (a b) (if a b #f)))
(define or2  (lambda (a b) (if a #t b)))

;; List indexing — O(n) but clear.
(define nth
  (lambda (n lst)
    (if (= n 0) (car lst) (nth (- n 1) (cdr lst)))))

(define length
  (lambda (lst)
    (if (null? lst) 0 (+ 1 (length (cdr lst))))))

;; Replace nth element (returns a fresh list).
(define replace-nth
  (lambda (n v lst)
    (if (= n 0)
        (cons v (cdr lst))
        (cons (car lst) (replace-nth (- n 1) v (cdr lst))))))

;; --- coordinates ---
(define square-index
  (lambda (f r) (+ (* (- f 1) 9) (- r 1))))

(define in-bounds?
  (lambda (f r)
    (and2 (and2 (>= f 1) (<= f 9))
          (and2 (>= r 1) (<= r 9)))))

;; --- piece decoding ---
(define piece-color
  (lambda (p)
    (cond ((= p 0)   0)
          ((>= p 200) 2)
          (else       1))))

(define piece-raw  ; strip color, keep promotion bit
  (lambda (p)
    (cond ((= p 0)   0)
          ((>= p 200) (- p 200))
          (else       (- p 100)))))

(define promoted?
  (lambda (p) (>= (piece-raw p) 50)))

(define piece-base ; 1..8 regardless of promotion
  (lambda (p)
    (let ((t (piece-raw p)))
      (if (>= t 50) (- t 50) t))))

(define same-color?
  (lambda (p c) (= (piece-color p) c)))

(define enemy?
  (lambda (p c)
    (and2 (not (= (piece-color p) 0))
          (not (= (piece-color p) c)))))

(define piece-at
  (lambda (board f r) (nth (square-index f r) board)))

(define empty-square?
  (lambda (board f r) (= (piece-at board f r) 0)))

;; --- side-relative geometry ---
(define forward-dr
  (lambda (color) (if (= color 1) -1 1)))

(define in-promotion-zone?
  (lambda (color r)
    (if (= color 1) (<= r 3) (>= r 7))))

(define last-rank
  (lambda (color) (if (= color 1) 1 9)))

(define second-last-rank?
  (lambda (color r)
    (if (= color 1) (<= r 2) (>= r 8))))

;; Sente-oriented step offsets per base type (1..8) and per promoted type (51..57).
;; Format: list of (df dr) pairs.
(define king-steps
  (list (list -1 -1) (list 0 -1) (list 1 -1)
        (list -1  0)             (list 1  0)
        (list -1  1) (list 0  1) (list 1  1)))

(define gold-steps-sente
  (list (list -1 -1) (list 0 -1) (list 1 -1)
        (list -1  0)             (list 1  0)
                     (list 0  1)))

(define silver-steps-sente
  (list (list -1 -1) (list 0 -1) (list 1 -1)
        (list -1  1)             (list 1  1)))

(define pawn-steps-sente  (list (list 0 -1)))
(define knight-steps-sente (list (list -1 -2) (list 1 -2)))

(define rook-dirs   (list (list  0 -1) (list 0 1) (list -1 0) (list 1 0)))
(define bishop-dirs (list (list -1 -1) (list 1 -1) (list -1 1) (list 1 1)))
(define lance-dirs-sente (list (list 0 -1)))

;; Mirror a (df dr) list for Gote.
(define mirror-pair (lambda (p) (list (- 0 (car p)) (- 0 (car (cdr p))))))
(define mirror
  (lambda (lst)
    (if (null? lst) ()
        (cons (mirror-pair (car lst)) (mirror (cdr lst))))))

(define for-color
  (lambda (color sente-list)
    (if (= color 1) sente-list (mirror sente-list))))

;; Returns the step-offsets for a piece (color-adjusted).
(define step-offsets
  (lambda (piece)
    (let ((c (piece-color piece))
          (b (piece-base piece))
          (pr (promoted? piece)))
      (cond
        ((= b 8) king-steps)                                ; King
        ((= b 5) (for-color c gold-steps-sente))            ; Gold
        ((= b 4) (if pr (for-color c gold-steps-sente)
                       (for-color c silver-steps-sente)))   ; Silver / +Silver
        ((= b 1) (if pr (for-color c gold-steps-sente)
                       (for-color c pawn-steps-sente)))     ; Pawn / Tokin
        ((= b 2) (if pr (for-color c gold-steps-sente) ()))  ; Lance / +Lance
        ((= b 3) (if pr (for-color c gold-steps-sente)
                       (for-color c knight-steps-sente)))   ; Knight / +Knight
        ((= b 7) (if pr king-steps ()))                     ; Rook / Dragon
        ((= b 6) (if pr king-steps ()))                     ; Bishop / Horse
        (else ())))))

;; Returns the slide-dirs for a piece (color-adjusted).
(define slide-dirs
  (lambda (piece)
    (let ((c (piece-color piece))
          (b (piece-base piece))
          (pr (promoted? piece)))
      (cond
        ((= b 7) rook-dirs)                          ; Rook / Dragon
        ((= b 6) bishop-dirs)                        ; Bishop / Horse
        ((= b 2) (if pr () (for-color c lance-dirs-sente))) ; Lance only when unpromoted
        (else ())))))

(define move-from-f (lambda (m) (nth 1 m)))
(define move-from-r (lambda (m) (nth 2 m)))
(define move-to-f   (lambda (m) (nth 3 m)))
(define move-to-r   (lambda (m) (nth 4 m)))
(define move-promote? (lambda (m) (nth 5 m)))

;; Does (df,dr) appear in a list of step-offsets?
(define has-step?
  (lambda (offsets df dr)
    (cond
      ((null? offsets) #f)
      ((and2 (= (car (car offsets)) df)
             (= (car (cdr (car offsets))) dr)) #t)
      (else (has-step? (cdr offsets) df dr)))))

;; Walk one square at a time from (f1,r1) by (sf,sr).  Returns #t iff we land
;; on (f2,r2) before going out of bounds or hitting any non-empty square in
;; between.  The destination square's contents are intentionally ignored —
;; capture-vs-empty is enforced by R-MV.3, not by movement shape.
(define slide-reaches?
  (lambda (board f1 r1 f2 r2 sf sr)
    (let ((nf (+ f1 sf)) (nr (+ r1 sr)))
      (cond
        ((not (in-bounds? nf nr)) #f)
        ((and2 (= nf f2) (= nr r2)) #t)
        ((not (= (piece-at board nf nr) 0)) #f)
        (else (slide-reaches? board nf nr f2 r2 sf sr))))))

;; Is (f2,r2) reachable from (f1,r1) along any of `dirs`?
(define has-slide?
  (lambda (board dirs f1 r1 f2 r2)
    (cond
      ((null? dirs) #f)
      (else
        (let ((d (car dirs)))
          (let ((sf (car d)) (sr (car (cdr d))))
            (if (slide-reaches? board f1 r1 f2 r2 sf sr)
                #t
                (has-slide? board (cdr dirs) f1 r1 f2 r2))))))))

(define move-shape-legal?
  (lambda (board piece f1 r1 f2 r2)
    (let ((df (- f2 f1)) (dr (- r2 r1)))
      (or2 (has-step? (step-offsets piece) df dr)
           (has-slide? board (slide-dirs piece) f1 r1 f2 r2)))))

(define move-basic-legal?    ; R-MV.1..5
  (lambda (state move)
    (let ((b (state-board state)) (stm (state-stm state))
          (f1 (move-from-f move)) (r1 (move-from-r move))
          (f2 (move-to-f move))   (r2 (move-to-r move)))
      (let ((src (piece-at b f1 r1)) (dst (piece-at b f2 r2)))
        (cond
          ((not (in-bounds? f1 r1)) #f)
          ((not (in-bounds? f2 r2)) #f)
          ((not (same-color? src stm)) #f)            ; R-MV.1
          ((same-color? dst stm) #f)                  ; R-MV.3
          ((not (move-shape-legal? b src f1 r1 f2 r2)) #f) ; R-MV.4/5
          (else #t))))))

;; `and2` is a function and therefore evaluates both arguments — fine for
;; cheap predicates, but `leaves-own-king-in-check?` re-applies the move,
;; so we **must** gate it behind cheap checks via `cond`/`if` to short-circuit.
(define move-legal?          ; R-MV.1..7 + promotion + check resolution
  (lambda (state move)
    (cond
      ((not (move-basic-legal? state move)) #f)         ; R-MV.1..5
      ((not (promotion-legal? state move)) #f)          ; S5
      ((leaves-own-king-in-check? state move) #f)       ; R-MV.6
      (else #t))))

(define promotable-base?
  (lambda (b) (and2 (not (= b 5)) (not (= b 8)))))

(define mandatory-promotion?  ; R-PR.2, R-PR.3
  (lambda (color base to-r)
    (cond
      ((not (promotable-base? base)) #f)
      ((or2 (= base 1) (= base 2)) (= to-r (last-rank color)))
      ((= base 3) (second-last-rank? color to-r))
      (else #f))))

(define promotion-eligible?  ; R-PR.1
  (lambda (color base from-r to-r)
    (and2 (promotable-base? base)
          (or2 (in-promotion-zone? color from-r)
               (in-promotion-zone? color to-r)))))

(define promotion-legal?
  (lambda (state move)
    (let ((b (state-board state))
          (f1 (move-from-f move)) (r1 (move-from-r move))
          (r2 (move-to-r move)))
      (let ((p (piece-at b f1 r1)))
        (let ((c (piece-color p)) (base (piece-base p))
              (already (promoted? p)) (asked (move-promote? move)))
          (cond
            (already (not asked))                                      ; R-PR.4
            ((mandatory-promotion? c base r2) asked)                    ; R-PR.2/3
            (asked (promotion-eligible? c base r1 r2))                  ; R-PR.1
            (else #t)))))))

(define hand-count
  (lambda (hand base)         ; base in 1..7
    (nth (- base 1) hand)))

(define file-has-own-unpromoted-pawn?
  (lambda (board color file r)
    (cond
      ((> r 9) #f)
      (else
        (let ((p (piece-at board file r)))
          (if (and2 (= (piece-base p) 1)
                    (and2 (= (piece-color p) color)
                          (not (promoted? p))))
              #t
              (file-has-own-unpromoted-pawn? board color file (+ r 1))))))))

(define drop-square-legal-for?
  (lambda (color base r)
    (cond
      ((or2 (= base 1) (= base 2)) (not (= r (last-rank color)))) ; R-DR.6
      ((= base 3) (not (second-last-rank? color r)))               ; R-DR.7
      (else #t))))

(define drop-basic-legal?    ; R-DR.1..3, R-DR.4, R-DR.6, R-DR.7
  (lambda (state drop)
    (let ((board (state-board state)) (stm (state-stm state))
          (base (nth 1 drop)) (f (nth 2 drop)) (r (nth 3 drop)))
      (let ((hand (if (= stm 1) (state-sente-hand state) (state-gote-hand state))))
        (cond
          ((not (in-bounds? f r)) #f)
          ((not (= (piece-at board f r) 0)) #f)               ; R-DR.2
          ((<= (hand-count hand base) 0) #f)                  ; R-DR.1
          ((not (drop-square-legal-for? stm base r)) #f)      ; R-DR.6/7
          ((and2 (= base 1) (file-has-own-unpromoted-pawn? board stm f 1)) #f) ; R-DR.4
          (else #t))))))

;; Short-circuit via `cond` — uchifuzume? recursively probes opponent moves,
;; so it must only run after the cheap gates pass.
(define drop-legal?
  (lambda (state drop)
    (cond
      ((not (drop-basic-legal? state drop)) #f)
      ((leaves-own-king-in-check-after-drop? state drop) #f)   ; R-DR.8
      ((uchifuzume? state drop) #f)                            ; R-DR.5
      (else #t))))

;; Square attacked by `attacker-color` in the given board, ignoring king-safety.
(define square-attacked?
  (lambda (board attacker-color tf tr)
    (any-piece-attacks? board attacker-color tf tr 1 1)))

;; Iterate the 81 squares; for each piece of attacker-color, ask whether its
;; pseudo-legal move-shape covers (tf,tr).  Returns #t on first hit.
(define any-piece-attacks?
  (lambda (board ac tf tr f r)
    (cond
      ((> f 9) #f)
      ((> r 9) (any-piece-attacks? board ac tf tr (+ f 1) 1))
      (else
        (let ((p (piece-at board f r)))
          (if (and2 (= (piece-color p) ac)
                    (move-shape-legal? board p f r tf tr))
              #t
              (any-piece-attacks? board ac tf tr f (+ r 1))))))))

(define king-in-check?
  (lambda (state color)
    (let ((sq (find-king (state-board state) color 1 1)))
      (square-attacked? (state-board state)
                        (if (= color 1) 2 1)
                        (car sq) (car (cdr sq))))))

(define checkmate?         ; R-EN.3
  (lambda (state)
    (cond
      ((not (king-in-check? state (state-stm state))) #f)
      ((has-any-legal-response? state) #f)
      (else #t))))

(define stalemate-loss?    ; R-EN.4
  (lambda (state)
    (cond
      ((king-in-check? state (state-stm state)) #f)
      ((has-any-legal-response? state) #f)
      (else #t))))

(define sennichite?        ; R-EN.5
  (lambda (state)
    (>= (history-count state (position-digest state)) 4)))

(define jishogi-points
  (lambda (board color f r acc)
    (cond
      ((> f 9) acc)
      ((> r 9) (jishogi-points board color (+ f 1) 1 acc))
      (else
        (let ((p (piece-at board f r)))
          (let ((add (cond
                       ((not (= (piece-color p) color)) 0)
                       ((= (piece-base p) 8) 0)
                       ((or2 (= (piece-base p) 6) (= (piece-base p) 7)) 5)
                       (else 1)))) ; hand pieces are added separately
            (jishogi-points board color f (+ r 1) (+ acc add))))))))

(define jishogi-loser?     ; R-EN.7
  (lambda (state color)
    (and2 (both-kings-in-zone? state)
          (< (+ (jishogi-points (state-board state) color 1 1 0)
                (hand-jishogi-points state color))
             24))))

;; --- find-king: sweep the board for the unique king of the given color
(define find-king
  (lambda (board color f r)
    (cond
      ((> f 9) (list 0 0))
      ((> r 9) (find-king board color (+ f 1) 1))
      (else
        (let ((p (piece-at board f r)))
          (if (and2 (= (piece-base p) 8) (= (piece-color p) color))
              (list f r)
              (find-king board color f (+ r 1))))))))

;; --- apply-move: produce the next state after a board move
(define apply-move-board
  (lambda (board move promote-flag)
    (let ((f1 (move-from-f move)) (r1 (move-from-r move))
          (f2 (move-to-f move))   (r2 (move-to-r move)))
      (let ((p (piece-at board f1 r1)))
        (let ((p-out (if promote-flag (+ p 50) p)))
          (replace-nth (square-index f1 r1) 0
            (replace-nth (square-index f2 r2) p-out board)))))))

(define captured-base
  (lambda (target)
    (if (= target 0) 0 (piece-base target))))

(define hand-add
  (lambda (hand base)
    (if (= base 0) hand
        (replace-nth (- base 1) (+ (nth (- base 1) hand) 1) hand))))

(define apply-move-state
  (lambda (state move)
    (let ((board (state-board state))
          (sh (state-sente-hand state))
          (gh (state-gote-hand state))
          (stm (state-stm state)))
      (let ((target (piece-at board (move-to-f move) (move-to-r move))))
        (let ((cap (captured-base target))
              (new-board (apply-move-board board move (move-promote? move))))
          (let ((new-sh (if (= stm 1) (hand-add sh cap) sh))
                (new-gh (if (= stm 2) (hand-add gh cap) gh)))
            (make-state new-board new-sh new-gh
                        (if (= stm 1) 2 1)
                        (+ (state-move-num state) 1)
                        (state-history state))))))))

(define apply-drop-state
  (lambda (state drop)
    (let ((board (state-board state))
          (sh (state-sente-hand state))
          (gh (state-gote-hand state))
          (stm (state-stm state)))
      (let ((base (nth 1 drop)) (f (nth 2 drop)) (r (nth 3 drop)))
        (let ((piece (+ (* stm 100) base))
              (hand-take (lambda (h)
                           (replace-nth (- base 1)
                                        (- (nth (- base 1) h) 1) h))))
          (let ((new-board (replace-nth (square-index f r) piece board))
                (new-sh (if (= stm 1) (hand-take sh) sh))
                (new-gh (if (= stm 2) (hand-take gh) gh)))
            (make-state new-board new-sh new-gh
                        (if (= stm 1) 2 1)
                        (+ (state-move-num state) 1)
                        (state-history state))))))))

;; --- leaves own king in check: applies the move/drop then re-runs
;; king-in-check? from the *mover's* perspective (we have to rebuild
;; the state because apply-* flips stm).
(define leaves-own-king-in-check?
  (lambda (state move)
    (let ((stm (state-stm state)))
      (let ((next (apply-move-state state move)))
        (king-in-check? (make-state (state-board next)
                                    (state-sente-hand next)
                                    (state-gote-hand next)
                                    stm
                                    (state-move-num next)
                                    (state-history next))
                        stm)))))

(define leaves-own-king-in-check-after-drop?
  (lambda (state drop)
    (let ((stm (state-stm state)))
      (let ((next (apply-drop-state state drop)))
        (king-in-check? (make-state (state-board next)
                                    (state-sente-hand next)
                                    (state-gote-hand next)
                                    stm
                                    (state-move-num next)
                                    (state-history next))
                        stm)))))

;; --- has-any-legal-response?: predicate (not count) used by checkmate?
;; / stalemate-loss? / uchifuzume?. Short-circuits on first legal move.
(define any-legal-move-from?
  (lambda (state f1 r1 f2 r2)
    (cond
      ((> f2 9) #f)
      ((> r2 9) (any-legal-move-from? state f1 r1 (+ f2 1) 1))
      ((move-legal? state (list 'move f1 r1 f2 r2 #f)) #t)
      ((move-legal? state (list 'move f1 r1 f2 r2 #t)) #t)
      (else (any-legal-move-from? state f1 r1 f2 (+ r2 1))))))

(define any-legal-board-move?
  (lambda (state f r)
    (cond
      ((> f 9) #f)
      ((> r 9) (any-legal-board-move? state (+ f 1) 1))
      (else
        (let ((p (piece-at (state-board state) f r)))
          (cond
            ((not (= (piece-color p) (state-stm state)))
             (any-legal-board-move? state f (+ r 1)))
            ((any-legal-move-from? state f r 1 1) #t)
            (else (any-legal-board-move? state f (+ r 1)))))))))

(define any-legal-drop-at-base?
  (lambda (state base f r)
    (cond
      ((> f 9) #f)
      ((> r 9) (any-legal-drop-at-base? state base (+ f 1) 1))
      ((drop-legal? state (list 'drop base f r)) #t)
      (else (any-legal-drop-at-base? state base f (+ r 1))))))

(define any-legal-drop?
  (lambda (state base)
    (cond
      ((> base 7) #f)
      ((any-legal-drop-at-base? state base 1 1) #t)
      (else (any-legal-drop? state (+ base 1))))))

(define has-any-legal-response?
  (lambda (state)
    (cond
      ((any-legal-board-move? state 1 1) #t)
      ((any-legal-drop? state 1) #t)
      (else #f))))

;; --- uchifuzume?: a pawn drop delivering immediate checkmate is illegal.
(define uchifuzume?
  (lambda (state drop)
    (let ((base (nth 1 drop)))
      (if (not (= base 1)) #f
          (let ((next (apply-drop-state state drop)))
            (cond
              ((not (king-in-check? next (state-stm next))) #f)
              ((has-any-legal-response? next) #f)
              (else #t)))))))

;; --- repetition / history (sennichite, R-EN.5)
(define list-equal?
  (lambda (a b)
    (cond
      ((null? a) (null? b))
      ((null? b) #f)
      ((pair? (car a))
       (if (pair? (car b))
           (and2 (list-equal? (car a) (car b)) (list-equal? (cdr a) (cdr b)))
           #f))
      ((pair? (car b)) #f)
      (else (and2 (= (car a) (car b)) (list-equal? (cdr a) (cdr b)))))))

(define position-digest
  (lambda (state)
    (list (state-board state)
          (state-sente-hand state)
          (state-gote-hand state)
          (state-stm state))))

(define history-count-iter
  (lambda (hist digest acc)
    (cond
      ((null? hist) acc)
      ((list-equal? (car hist) digest)
       (history-count-iter (cdr hist) digest (+ acc 1)))
      (else (history-count-iter (cdr hist) digest acc)))))

(define history-count
  (lambda (state digest)
    (history-count-iter (state-history state) digest 0)))

;; --- jishōgi (R-EN.7) helpers
(define both-kings-in-zone?
  (lambda (state)
    (let ((sk (find-king (state-board state) 1 1 1))
          (gk (find-king (state-board state) 2 1 1)))
      (and2 (in-promotion-zone? 1 (car (cdr sk)))
            (in-promotion-zone? 2 (car (cdr gk)))))))

(define hand-jishogi-points
  (lambda (state color)
    (let ((h (if (= color 1) (state-sente-hand state) (state-gote-hand state))))
      (+ (nth 0 h) (+ (nth 1 h) (+ (nth 2 h) (+ (nth 3 h) (+ (nth 4 h)
         (+ (* (nth 5 h) 5) (* (nth 6 h) 5))))))))))

