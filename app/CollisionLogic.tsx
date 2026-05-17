/**
 * Logic xử lý va chạm giữa các quả bóng (Ball-Ball Collision)
 */
export const resolveBallCollisions = (gameData: any, canvasWidth: number, isReverse: boolean, onCollide?: () => void) => {
  const ball = gameData.ball;
  const bombs = gameData.bombs;

  // Danh sách tất cả các vật thể đang rơi (Bóng chính + Bombs)
  const objects = [
    { ref: ball, isMain: true },
    ...bombs.map((b: any) => ({ ref: b, isMain: false }))
  ];

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const objA = objects[i].ref;
      const objB = objects[j].ref;

      const dx = objB.x - objA.x;
      const dy = objB.y - objA.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = objA.radius + objB.radius;

      if (distance < minDistance && distance > 0) {
        // 1. Xử lý chồng lấn (Overlap) - Đẩy hai quả bóng ra xa nhau để không bị dính
        const overlap = minDistance - distance;
        const nx = dx / distance; // Normal X
        const ny = dy / distance; // Normal Y
        
        const moveX = nx * overlap / 2;
        const moveY = ny * overlap / 2;

        objA.x -= moveX;
        objA.y -= moveY;
        objB.x += moveX;
        objB.y += moveY;

        // 2. Xử lý phản lực (Bounce) - Simplified 2D elastic collision
        const restitution = 0.9; // Hệ số đàn hồi (0.0 = không đàn hồi, 1.0 = đàn hồi hoàn toàn)
        const speedBoost = 0.5; // Tốc độ cộng thêm sau va chạm
        
        const gravityDirection = isReverse ? -1 : 1;

        // Vận tốc trước va chạm (sử dụng vận tốc dọc thực tế)
        const v1 = { x: objA.dx, y: objA.speed * gravityDirection };
        const v2 = { x: objB.dx, y: objB.speed * gravityDirection };

        // Vận tốc tương đối
        const vr = { x: v1.x - v2.x, y: v1.y - v2.y };

        // Vận tốc dọc theo vector pháp tuyến
        const vn = vr.x * nx + vr.y * ny;
        
        // Chỉ xử lý nếu các vật thể đang di chuyển về phía nhau
        if (vn < 0) {
            // Tính toán xung lượng (giả sử khối lượng bằng nhau)
            const impulse = -(1 + restitution) * vn;

            // Áp dụng xung lượng vào vận tốc
            v1.x += impulse * nx;
            v1.y += impulse * ny;
            v2.x -= impulse * nx;
            v2.y -= impulse * ny;

            // Cập nhật dx và speed cho objA
            objA.dx = v1.x;
            objA.speed = Math.abs(v1.y) + speedBoost; // Luôn là tốc độ dương, cộng thêm boost

            // Cập nhật dx và speed cho objB
            objB.dx = v2.x;
            objB.speed = Math.abs(v2.y) + speedBoost; // Luôn là tốc độ dương, cộng thêm boost

            // Kích hoạt callback âm thanh
            if (onCollide) onCollide();
        }

        // Giới hạn dx và speed để tránh giá trị quá lớn
        const maxDx = 15; // Tốc độ ngang tối đa
        const maxSpeed = 80; // Tốc độ dọc tối đa (tương tự MainGameLogic)

        const clamp = (obj: any) => {
            obj.dx = Math.max(-maxDx, Math.min(maxDx, obj.dx));
            obj.speed = Math.min(maxSpeed, obj.speed);
            // Đồng thời giới hạn vị trí x để bóng không ra khỏi biên sau va chạm
            obj.x = Math.max(obj.radius, Math.min(canvasWidth - obj.radius, obj.x));
        };
        clamp(objA);
        clamp(objB);
      }
    }
  }
};