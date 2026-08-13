import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BookingDB, mapBookingDBToBooking, CreateBooking, UpdateBooking } from '../../models/terrainfinitus/Booking';


@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.terrainfinitusApiUrl + '/api/bookings';

  getBookings() {
    return this.http.get<BookingDB[]>(`${this.apiUrl}`).pipe(
      map((bookingsDB) => bookingsDB.map(mapBookingDBToBooking)),
    );
  }

  getBookingByUuid(uuid: string) {
    return this.http.get<BookingDB>(`${this.apiUrl}/${uuid}`).pipe(
      map(mapBookingDBToBooking),
    );
  }

  getBookingsByUserId(userId: string) {
    return this.http.get<BookingDB[]>(`${this.apiUrl}/user/${userId}`).pipe(
      map(bookingsDB => bookingsDB.map(mapBookingDBToBooking)),
    );
  }

  createBooking(booking: CreateBooking) {
    return this.http.post<BookingDB>(`${this.apiUrl}`, booking).pipe(
      map(mapBookingDBToBooking),
    );
  }

  updateBooking(booking: UpdateBooking) {
    return this.http.put<BookingDB>(`${this.apiUrl}/${booking.uuid}`, booking).pipe(
      map(mapBookingDBToBooking),
    );
  }

  deleteBooking(uuid: string) {
    return this.http.delete<void>(`${this.apiUrl}/${uuid}`);
  }
}
